/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Services = require("Services");
const { extend } = require("sdk/core/heritage");
const { AutoRefreshHighlighter } = require("./auto-refresh");
const {
  CanvasFrameAnonymousContentHelper,
  createNode,
  createSVGNode,
  moveInfobar,
} = require("./utils/markup");
const {
  getCurrentZoom,
  getDisplayPixelRatio,
  setIgnoreLayoutChanges,
  getViewportDimensions,
} = require("devtools/shared/layout/utils");
const { stringifyGridFragments } = require("devtools/server/actors/utils/css-grid-utils");

const CSS_GRID_ENABLED_PREF = "layout.css.grid.enabled";

const DEFAULT_GRID_COLOR = "#4B0082";

const COLUMNS = "cols";
const ROWS = "rows";

const GRID_FONT_SIZE = 10;
const GRID_FONT_FAMILY = "sans-serif";

const GRID_LINES_PROPERTIES = {
  "edge": {
    lineDash: [0, 0],
    alpha: 1,
  },
  "explicit": {
    lineDash: [5, 3],
    alpha: 0.75,
  },
  "implicit": {
    lineDash: [2, 2],
    alpha: 0.5,
  }
};

const GRID_GAP_PATTERN_WIDTH = 14; // px
const GRID_GAP_PATTERN_HEIGHT = 14; // px
const GRID_GAP_PATTERN_LINE_DASH = [5, 3]; // px
const GRID_GAP_ALPHA = 0.5;

/**
 * Cached used by `CssGridHighlighter.getGridGapPattern`.
 */
const gCachedGridPattern = new Map();

// We create a <canvas> element that has always 4096x4096 physical pixels, to displays
// our grid's overlay.
// Then, we move the element around when needed, to give the perception that it always
// covers the screen (See bug 1345434).
//
// This canvas size value is the safest we can use because most GPUs can handle it.
// It's also far from the maximum canvas memory allocation limit (4096x4096x4 is
// 67.108.864 bytes, where the limit is 500.000.000 bytes, see:
// http://searchfox.org/mozilla-central/source/gfx/thebes/gfxPrefs.h#401).
//
// Note:
// Once bug 1232491 lands, we could try to refactor this code to use the values from
// the displayport API instead.
//
// Using a fixed value should also solve bug 1348293.
const CANVAS_SIZE = 4096;

/**
 * The CssGridHighlighter is the class that overlays a visual grid on top of
 * display:[inline-]grid elements.
 *
 * Usage example:
 * let h = new CssGridHighlighter(env);
 * h.show(node, options);
 * h.hide();
 * h.destroy();
 *
 * Available Options:
 * - color(colorValue)
 *     @param  {String} colorValue
 *     The color that should be used to draw the highlighter for this grid.
 * - showAllGridAreas(isShown)
 *     @param  {Boolean} isShown
 *     Shows all the grid area highlights for the current grid if isShown is true.
 * - showGridArea(areaName)
 *     @param  {String} areaName
 *     Shows the grid area highlight for the given area name.
 * - showGridCell({ gridFragmentIndex: Number, rowNumber: Number, columnNumber: Number })
 *     @param  {Object} { gridFragmentIndex: Number, rowNumber: Number,
 *                        columnNumber: Number }
 *     An object containing the grid fragment index, row and column numbers to the
 *     corresponding grid cell to highlight for the current grid.
 * - showGridLineNumbers(isShown)
 *     @param  {Boolean} isShown
 *     Displays the grid line numbers on the grid lines if isShown is true.
 * - showInfiniteLines(isShown)
 *     @param  {Boolean} isShown
 *     Displays an infinite line to represent the grid lines if isShown is true.
 *
 * Structure:
 * <div class="highlighter-container">
 *   <canvas id="css-grid-canvas" class="css-grid-canvas">
 *   <svg class="css-grid-elements" hidden="true">
 *     <g class="css-grid-regions">
 *       <path class="css-grid-areas" points="..." />
 *       <path class="css-grid-cells" points="..." />
 *     </g>
 *   </svg>
 *   <div class="css-grid-area-infobar-container">
 *     <div class="css-grid-infobar">
 *       <div class="css-grid-infobar-text">
 *         <span class="css-grid-area-infobar-name">Grid Area Name</span>
 *         <span class="css-grid-area-infobar-dimensions"Grid Area Dimensions></span>
 *       </div>
 *     </div>
 *   </div>
 *   <div class="css-grid-cell-infobar-container">
 *     <div class="css-grid-infobar">
 *       <div class="css-grid-infobar-text">
 *         <span class="css-grid-cell-infobar-position">Grid Cell Position</span>
 *         <span class="css-grid-cell-infobar-dimensions"Grid Cell Dimensions></span>
 *       </div>
 *     </div>
 *   </div>
 * </div>
 */
function CssGridHighlighter(highlighterEnv) {
  AutoRefreshHighlighter.call(this, highlighterEnv);

  this.markup = new CanvasFrameAnonymousContentHelper(this.highlighterEnv,
    this._buildMarkup.bind(this));

  this.onNavigate = this.onNavigate.bind(this);
  this.onPageHide = this.onPageHide.bind(this);
  this.onWillNavigate = this.onWillNavigate.bind(this);

  this.highlighterEnv.on("navigate", this.onNavigate);
  this.highlighterEnv.on("will-navigate", this.onWillNavigate);

  let { pageListenerTarget } = highlighterEnv;
  pageListenerTarget.addEventListener("pagehide", this.onPageHide);

  // Initialize the <canvas> position to the top left corner of the page
  this._canvasPosition = {
    x: 0,
    y: 0
  };

  // Calling `calculateCanvasPosition` anyway since the highlighter could be initialized
  // on a page that has scrolled already.
  this.calculateCanvasPosition();
}

CssGridHighlighter.prototype = extend(AutoRefreshHighlighter.prototype, {
  typeName: "CssGridHighlighter",

  ID_CLASS_PREFIX: "css-grid-",

  _buildMarkup() {
    let container = createNode(this.win, {
      attributes: {
        "class": "highlighter-container"
      }
    });

    let root = createNode(this.win, {
      parent: container,
      attributes: {
        "id": "root",
        "class": "root"
      },
      prefix: this.ID_CLASS_PREFIX
    });

    // We use a <canvas> element so that we can draw an arbitrary number of lines
    // which wouldn't be possible with HTML or SVG without having to insert and remove
    // the whole markup on every update.
    createNode(this.win, {
      parent: root,
      nodeType: "canvas",
      attributes: {
        "id": "canvas",
        "class": "canvas",
        "hidden": "true",
        "width": CANVAS_SIZE,
        "height": CANVAS_SIZE
      },
      prefix: this.ID_CLASS_PREFIX
    });

    // Build the SVG element
    let svg = createSVGNode(this.win, {
      nodeType: "svg",
      parent: root,
      attributes: {
        "id": "elements",
        "width": "100%",
        "height": "100%",
        "hidden": "true"
      },
      prefix: this.ID_CLASS_PREFIX
    });

    let regions = createSVGNode(this.win, {
      nodeType: "g",
      parent: svg,
      attributes: {
        "class": "regions"
      },
      prefix: this.ID_CLASS_PREFIX
    });

    createSVGNode(this.win, {
      nodeType: "path",
      parent: regions,
      attributes: {
        "class": "areas",
        "id": "areas"
      },
      prefix: this.ID_CLASS_PREFIX
    });

    createSVGNode(this.win, {
      nodeType: "path",
      parent: regions,
      attributes: {
        "class": "cells",
        "id": "cells"
      },
      prefix: this.ID_CLASS_PREFIX
    });

    // Building the grid area infobar markup
    let areaInfobarContainer = createNode(this.win, {
      parent: container,
      attributes: {
        "class": "area-infobar-container",
        "id": "area-infobar-container",
        "position": "top",
        "hidden": "true"
      },
      prefix: this.ID_CLASS_PREFIX
    });

    let areaInfobar = createNode(this.win, {
      parent: areaInfobarContainer,
      attributes: {
        "class": "infobar"
      },
      prefix: this.ID_CLASS_PREFIX
    });

    let areaTextbox = createNode(this.win, {
      parent: areaInfobar,
      attributes: {
        "class": "infobar-text"
      },
      prefix: this.ID_CLASS_PREFIX
    });
    createNode(this.win, {
      nodeType: "span",
      parent: areaTextbox,
      attributes: {
        "class": "area-infobar-name",
        "id": "area-infobar-name"
      },
      prefix: this.ID_CLASS_PREFIX
    });
    createNode(this.win, {
      nodeType: "span",
      parent: areaTextbox,
      attributes: {
        "class": "area-infobar-dimensions",
        "id": "area-infobar-dimensions"
      },
      prefix: this.ID_CLASS_PREFIX
    });

    // Building the grid cell infobar markup
    let cellInfobarContainer = createNode(this.win, {
      parent: container,
      attributes: {
        "class": "cell-infobar-container",
        "id": "cell-infobar-container",
        "position": "top",
        "hidden": "true"
      },
      prefix: this.ID_CLASS_PREFIX
    });

    let cellInfobar = createNode(this.win, {
      parent: cellInfobarContainer,
      attributes: {
        "class": "infobar"
      },
      prefix: this.ID_CLASS_PREFIX
    });

    let cellTextbox = createNode(this.win, {
      parent: cellInfobar,
      attributes: {
        "class": "infobar-text"
      },
      prefix: this.ID_CLASS_PREFIX
    });
    createNode(this.win, {
      nodeType: "span",
      parent: cellTextbox,
      attributes: {
        "class": "cell-infobar-position",
        "id": "cell-infobar-position"
      },
      prefix: this.ID_CLASS_PREFIX
    });
    createNode(this.win, {
      nodeType: "span",
      parent: cellTextbox,
      attributes: {
        "class": "cell-infobar-dimensions",
        "id": "cell-infobar-dimensions"
      },
      prefix: this.ID_CLASS_PREFIX
    });

    return container;
  },

  destroy() {
    let { highlighterEnv } = this;
    highlighterEnv.off("navigate", this.onNavigate);
    highlighterEnv.off("will-navigate", this.onWillNavigate);

    let { pageListenerTarget } = highlighterEnv;
    if (pageListenerTarget) {
      pageListenerTarget.removeEventListener("pagehide", this.onPageHide);
    }

    this.markup.destroy();

    // Clear the pattern cache to avoid dead object exceptions (Bug 1342051).
    this._clearCache();
    AutoRefreshHighlighter.prototype.destroy.call(this);
  },

  getElement(id) {
    return this.markup.getElement(this.ID_CLASS_PREFIX + id);
  },

  get ctx() {
    return this.canvas.getCanvasContext("2d");
  },

  get canvas() {
    return this.getElement("canvas");
  },

  get color() {
    return this.options.color || DEFAULT_GRID_COLOR;
  },

  /**
   * Gets the grid gap pattern used to render the gap regions based on the device
   * pixel ratio given.
   *
   * @param {Number} devicePixelRatio
   *         The device pixel ratio we want the pattern for.
   * @param  {Object} dimension
   *         Refers to the Map key for the grid dimension type which is either the
   *         constant COLUMNS or ROWS.
   * @return {CanvasPattern} grid gap pattern.
   */
  getGridGapPattern(devicePixelRatio, dimension) {
    let gridPatternMap = null;

    if (gCachedGridPattern.has(devicePixelRatio)) {
      gridPatternMap = gCachedGridPattern.get(devicePixelRatio);
    } else {
      gridPatternMap = new Map();
    }

    if (gridPatternMap.has(dimension)) {
      return gridPatternMap.get(dimension);
    }

    // Create the diagonal lines pattern for the rendering the grid gaps.
    let canvas = createNode(this.win, { nodeType: "canvas" });
    let width = canvas.width = GRID_GAP_PATTERN_WIDTH * devicePixelRatio;
    let height = canvas.height = GRID_GAP_PATTERN_HEIGHT * devicePixelRatio;

    let ctx = canvas.getContext("2d");
    ctx.save();
    ctx.setLineDash(GRID_GAP_PATTERN_LINE_DASH);
    ctx.beginPath();
    ctx.translate(.5, .5);

    if (dimension === COLUMNS) {
      ctx.moveTo(0, 0);
      ctx.lineTo(width, height);
    } else {
      ctx.moveTo(width, 0);
      ctx.lineTo(0, height);
    }

    ctx.strokeStyle = this.color;
    ctx.globalAlpha = GRID_GAP_ALPHA;
    ctx.stroke();
    ctx.restore();

    let pattern = ctx.createPattern(canvas, "repeat");

    gridPatternMap.set(dimension, pattern);
    gCachedGridPattern.set(devicePixelRatio, gridPatternMap);

    return pattern;
  },

  /**
   * Called when the page navigates. Used to clear the cached gap patterns and avoid
   * using DeadWrapper objects as gap patterns the next time.
   */
  onNavigate() {
    this._clearCache();
  },

  onPageHide: function ({ target }) {
    // If a page hide event is triggered for current window's highlighter, hide the
    // highlighter.
    if (target.defaultView === this.win) {
      this.hide();
    }
  },

  onWillNavigate({ isTopLevel }) {
    if (isTopLevel) {
      this.hide();
    }
  },

  _show() {
    if (Services.prefs.getBoolPref(CSS_GRID_ENABLED_PREF) && !this.isGrid()) {
      this.hide();
      return false;
    }

    // The grid pattern cache should be cleared in case the color changed.
    this._clearCache();

    // Hide the canvas, grid element highlights and infobar.
    this._hide();

    return this._update();
  },

  _clearCache() {
    gCachedGridPattern.clear();
  },

  /**
   * Shows the grid area highlight for the given area name.
   *
   * @param  {String} areaName
   *         Grid area name.
   */
  showGridArea(areaName) {
    this.renderGridArea(areaName);
  },

  /**
   * Shows all the grid area highlights for the current grid.
   */
  showAllGridAreas() {
    this.renderGridArea();
  },

  /**
   * Clear the grid area highlights.
   */
  clearGridAreas() {
    let areas = this.getElement("areas");
    areas.setAttribute("d", "");
  },

  /**
   * Shows the grid cell highlight for the given grid cell options.
   *
   * @param  {Number} options.gridFragmentIndex
   *         Index of the grid fragment to render the grid cell highlight.
   * @param  {Number} options.rowNumber
   *         Row number of the grid cell to highlight.
   * @param  {Number} options.columnNumber
   *         Column number of the grid cell to highlight.
   */
  showGridCell({ gridFragmentIndex, rowNumber, columnNumber }) {
    this.renderGridCell(gridFragmentIndex, rowNumber, columnNumber);
  },

  /**
   * Clear the grid cell highlights.
   */
  clearGridCell() {
    let cells = this.getElement("cells");
    cells.setAttribute("d", "");
  },

  /**
   * Checks if the current node has a CSS Grid layout.
   *
   * @return  {Boolean} true if the current node has a CSS grid layout, false otherwise.
   */
  isGrid() {
    return this.currentNode.getGridFragments().length > 0;
  },

  /**
   * The AutoRefreshHighlighter's _hasMoved method returns true only if the
   * element's quads have changed. Override it so it also returns true if the
   * element's grid has changed (which can happen when you change the
   * grid-template-* CSS properties with the highlighter displayed).
   */
  _hasMoved() {
    let hasMoved = AutoRefreshHighlighter.prototype._hasMoved.call(this);

    let oldGridData = stringifyGridFragments(this.gridData);
    this.gridData = this.currentNode.getGridFragments();
    let newGridData = stringifyGridFragments(this.gridData);

    return hasMoved || oldGridData !== newGridData;
  },

  /**
   * Update the highlighter on the current highlighted node (the one that was
   * passed as an argument to show(node)).
   * Should be called whenever node's geometry or grid changes.
   */
  _update() {
    setIgnoreLayoutChanges(true);

    let root = this.getElement("root");
    // Hide the root element and force the reflow in order to get the proper window's
    // dimensions without increasing them.
    root.setAttribute("style", "display: none");
    this.win.document.documentElement.offsetWidth;

    let { width, height } = this._winDimensions;

    // Updates the <canvas> element's position and size.
    // It also clear the <canvas>'s drawing context.
    this.updateCanvasElement();

    // Clear the grid area highlights.
    this.clearGridAreas();
    this.clearGridCell();

    // Start drawing the grid fragments.
    for (let i = 0; i < this.gridData.length; i++) {
      let fragment = this.gridData[i];
      let quad = this.currentQuads.content[i];
      this.renderFragment(fragment, quad);
    }

    // Display the grid area highlights if needed.
    if (this.options.showAllGridAreas) {
      this.showAllGridAreas();
    } else if (this.options.showGridArea) {
      this.showGridArea(this.options.showGridArea);
    }

    // Display the grid cell highlights if needed.
    if (this.options.showGridCell) {
      this.showGridCell(this.options.showGridCell);
    }

    this._showGrid();
    this._showGridElements();

    root.setAttribute("style",
      `position:absolute; width:${width}px;height:${height}px; overflow:hidden`);

    setIgnoreLayoutChanges(false, this.highlighterEnv.document.documentElement);
    return true;
  },

  /**
   * Update the grid information displayed in the grid area info bar.
   *
   * @param  {GridArea} area
   *         The grid area object.
   * @param  {Number} x1
   *         The first x-coordinate of the grid area rectangle.
   * @param  {Number} x2
   *         The second x-coordinate of the grid area rectangle.
   * @param  {Number} y1
   *         The first y-coordinate of the grid area rectangle.
   * @param  {Number} y2
   *         The second y-coordinate of the grid area rectangle.
   */
  _updateGridAreaInfobar(area, x1, x2, y1, y2) {
    let width = x2 - x1;
    let height = y2 - y1;
    let dim = parseFloat(width.toPrecision(6)) +
              " \u00D7 " +
              parseFloat(height.toPrecision(6));

    this.getElement("area-infobar-name").setTextContent(area.name);
    this.getElement("area-infobar-dimensions").setTextContent(dim);

    let container = this.getElement("area-infobar-container");
    this._moveInfobar(container, x1, x2, y1, y2);
  },

  _updateGridCellInfobar(rowNumber, columnNumber, x1, x2, y1, y2) {
    let width = x2 - x1;
    let height = y2 - y1;
    let dim = parseFloat(width.toPrecision(6)) +
              " \u00D7 " +
              parseFloat(height.toPrecision(6));
    let position = `${rowNumber}\/${columnNumber}`;

    this.getElement("cell-infobar-position").setTextContent(position);
    this.getElement("cell-infobar-dimensions").setTextContent(dim);

    let container = this.getElement("cell-infobar-container");
    this._moveInfobar(container, x1, x2, y1, y2);
  },

  /**
   * Move the given grid infobar to the right place in the highlighter.
   *
   * @param  {Number} x1
   *         The first x-coordinate of the grid rectangle.
   * @param  {Number} x2
   *         The second x-coordinate of the grid rectangle.
   * @param  {Number} y1
   *         The first y-coordinate of the grid rectangle.
   * @param  {Number} y2
   *         The second y-coordinate of the grid rectangle.
   */
  _moveInfobar(container, x1, x2, y1, y2) {
    let bounds = {
      bottom: y2,
      height: y2 - y1,
      left: x1,
      right: x2,
      top: y1,
      width: x2 - x1,
      x: x1,
      y: y1,
    };

    moveInfobar(container, bounds, this.win);
  },

  /**
   * The <canvas>'s position needs to be updated if the page scrolls too much, in order
   * to give the illusion that it always covers the viewport.
   */
  _scrollUpdate() {
    let hasPositionChanged = this.calculateCanvasPosition();

    if (hasPositionChanged) {
      this._update();
    }
  },

  /**
   * This method is responsible to do the math that updates the <canvas>'s position,
   * in accordance with the page's scroll, document's size, canvas size, and
   * viewport's size.
   * It's called when a page's scroll is detected.
   *
   * @return {Boolean} `true` if the <canvas> position was updated, `false` otherwise.
   */
  calculateCanvasPosition() {
    let cssCanvasSize = CANVAS_SIZE / this.win.devicePixelRatio;
    let viewportSize = getViewportDimensions(this.win);
    let documentSize = this._winDimensions;
    let pageX = this._scroll.x;
    let pageY = this._scroll.y;
    let canvasWidth = cssCanvasSize;
    let canvasHeight = cssCanvasSize;
    let hasUpdated = false;

    // Those values indicates the relative horizontal and vertical space the page can
    // scroll before we have to reposition the <canvas>; they're 1/4 of the delta between
    // the canvas' size and the viewport's size: that's because we want to consider both
    // sides (top/bottom, left/right; so 1/2 for each side) and also we don't want to
    // shown the edges of the canvas in case of fast scrolling (to avoid showing undraw
    // areas, therefore another 1/2 here).
    let bufferSizeX = (canvasWidth - viewportSize.width) >> 2;
    let bufferSizeY = (canvasHeight - viewportSize.height) >> 2;

    let { x, y } = this._canvasPosition;

    // Defines the boundaries for the canvas.
    let topBoundary = 0;
    let bottomBoundary = documentSize.height - canvasHeight;
    let leftBoundary = 0;
    let rightBoundary = documentSize.width - canvasWidth;

    // Defines the thresholds that triggers the canvas' position to be updated.
    let topThreshold = pageY - bufferSizeY;
    let bottomThreshold = pageY - canvasHeight + viewportSize.height + bufferSizeY;
    let leftThreshold = pageX - bufferSizeX;
    let rightThreshold = pageX - canvasWidth + viewportSize.width + bufferSizeX;

    if (y < bottomBoundary && y < bottomThreshold) {
      this._canvasPosition.y = Math.min(topThreshold, bottomBoundary);
      hasUpdated = true;
    } else if (y > topBoundary && y > topThreshold) {
      this._canvasPosition.y = Math.max(bottomThreshold, topBoundary);
      hasUpdated = true;
    }

    if (x < rightBoundary && x < rightThreshold) {
      this._canvasPosition.x = Math.min(leftThreshold, rightBoundary);
      hasUpdated = true;
    } else if (x > leftBoundary && x > leftThreshold) {
      this._canvasPosition.x = Math.max(rightThreshold, leftBoundary);
      hasUpdated = true;
    }

    return hasUpdated;
  },

  /**
   *  Updates the <canvas> element's style in accordance with the current window's
   * devicePixelRatio, and the position calculated in `calculateCanvasPosition`; it also
   * clears the drawing context.
   */
  updateCanvasElement() {
    let ratio = parseFloat((this.win.devicePixelRatio || 1).toFixed(2));
    let size = CANVAS_SIZE / ratio;
    let { x, y } = this._canvasPosition;

    // Resize the canvas taking the dpr into account so as to have crisp lines, and
    // translating it to give the perception that it always covers the viewport.
    this.canvas.setAttribute("style",
      `width:${size}px;height:${size}px; transform: translate(${x}px, ${y}px);`);

    this.ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  },

  getFirstRowLinePos(fragment) {
    return fragment.rows.lines[0].start;
  },

  getLastRowLinePos(fragment) {
    return fragment.rows.lines[fragment.rows.lines.length - 1].start;
  },

  getFirstColLinePos(fragment) {
    return fragment.cols.lines[0].start;
  },

  getLastColLinePos(fragment) {
    return fragment.cols.lines[fragment.cols.lines.length - 1].start;
  },

  /**
   * Get the GridLine index of the last edge of the explicit grid for a grid dimension.
   *
   * @param  {GridTracks} tracks
   *         The grid track of a given grid dimension.
   * @return {Number} index of the last edge of the explicit grid for a grid dimension.
   */
  getLastEdgeLineIndex(tracks) {
    let trackIndex = tracks.length - 1;

    // Traverse the grid track backwards until we find an explicit track.
    while (trackIndex >= 0 && tracks[trackIndex].type != "explicit") {
      trackIndex--;
    }

    // The grid line index is the grid track index + 1.
    return trackIndex + 1;
  },

  renderFragment(fragment, quad) {
    this.renderLines(fragment.cols, quad, COLUMNS, "left", "top", "height",
                     this.getFirstRowLinePos(fragment),
                     this.getLastRowLinePos(fragment));
    this.renderLines(fragment.rows, quad, ROWS, "top", "left", "width",
                     this.getFirstColLinePos(fragment),
                     this.getLastColLinePos(fragment));
  },

  /**
   * Render the grid lines given the grid dimension information of the
   * column or row lines.
   *
   * @param  {GridDimension} gridDimension
   *         Column or row grid dimension object.
   * @param  {Object} quad.bounds
   *         The content bounds of the box model region quads.
   * @param  {String} dimensionType
   *         The grid dimension type which is either the constant COLUMNS or ROWS.
   * @param  {String} mainSide
   *         The main side of the given grid dimension - "top" for rows and
   *         "left" for columns.
   * @param  {String} crossSide
   *         The cross side of the given grid dimension - "left" for rows and
   *         "top" for columns.
   * @param  {String} mainSize
   *         The main size of the given grid dimension - "width" for rows and
   *         "height" for columns.
   * @param  {Number} startPos
   *         The start position of the cross side of the grid dimension.
   * @param  {Number} endPos
   *         The end position of the cross side of the grid dimension.
   */
  renderLines(gridDimension, {bounds}, dimensionType, mainSide, crossSide,
              mainSize, startPos, endPos) {
    let currentZoom = getCurrentZoom(this.win);
    let lineStartPos = (bounds[crossSide] / currentZoom) + startPos;
    let lineEndPos = (bounds[crossSide] / currentZoom) + endPos;

    if (this.options.showInfiniteLines) {
      lineStartPos = 0;
      lineEndPos = Infinity;
    }

    let lastEdgeLineIndex = this.getLastEdgeLineIndex(gridDimension.tracks);

    for (let i = 0; i < gridDimension.lines.length; i++) {
      let line = gridDimension.lines[i];
      let linePos = (bounds[mainSide] / currentZoom) + line.start;

      if (this.options.showGridLineNumbers) {
        this.renderGridLineNumber(line.number, linePos, lineStartPos, dimensionType);
      }

      if (i == 0 || i == lastEdgeLineIndex) {
        this.renderLine(linePos, lineStartPos, lineEndPos, dimensionType, "edge");
      } else {
        this.renderLine(linePos, lineStartPos, lineEndPos, dimensionType,
                        gridDimension.tracks[i - 1].type);
      }

      // Render a second line to illustrate the gutter for non-zero breadth.
      if (line.breadth > 0) {
        this.renderGridGap(linePos, lineStartPos, lineEndPos, line.breadth,
                           dimensionType);
        this.renderLine(linePos + line.breadth, lineStartPos, lineEndPos, dimensionType,
                        gridDimension.tracks[i].type);
      }
    }
  },

  /**
   * Render the grid line on the css grid highlighter canvas.
   *
   * @param  {Number} linePos
   *         The line position along the x-axis for a column grid line and
   *         y-axis for a row grid line.
   * @param  {Number} startPos
   *         The start position of the cross side of the grid line.
   * @param  {Number} endPos
   *         The end position of the cross side of the grid line.
   * @param  {String} dimensionType
   *         The grid dimension type which is either the constant COLUMNS or ROWS.
   * @param  {String} lineType
   *         The grid line type - "edge", "explicit", or "implicit".
   */
  renderLine(linePos, startPos, endPos, dimensionType, lineType) {
    let { devicePixelRatio } = this.win;
    let lineWidth = getDisplayPixelRatio(this.win);
    let offset = (lineWidth / 2) % 1;

    let x = Math.round(this._canvasPosition.x * devicePixelRatio);
    let y = Math.round(this._canvasPosition.y * devicePixelRatio);

    linePos = Math.round(linePos * devicePixelRatio);
    startPos = Math.round(startPos * devicePixelRatio);

    this.ctx.save();
    this.ctx.setLineDash(GRID_LINES_PROPERTIES[lineType].lineDash);
    this.ctx.beginPath();
    this.ctx.translate(offset - x, offset - y);
    this.ctx.lineWidth = lineWidth;

    if (dimensionType === COLUMNS) {
      endPos = isFinite(endPos) ? endPos * devicePixelRatio : CANVAS_SIZE + y;
      this.ctx.moveTo(linePos, startPos);
      this.ctx.lineTo(linePos, endPos);
    } else {
      endPos = isFinite(endPos) ? endPos * devicePixelRatio : CANVAS_SIZE + x;
      this.ctx.moveTo(startPos, linePos);
      this.ctx.lineTo(endPos, linePos);
    }

    this.ctx.strokeStyle = this.color;
    this.ctx.globalAlpha = GRID_LINES_PROPERTIES[lineType].alpha;

    this.ctx.stroke();
    this.ctx.restore();
  },

  /**
   * Render the grid line number on the css grid highlighter canvas.
   *
   * @param  {Number} lineNumber
   *         The grid line number.
   * @param  {Number} linePos
   *         The line position along the x-axis for a column grid line and
   *         y-axis for a row grid line.
   * @param  {Number} startPos
   *         The start position of the cross side of the grid line.
   * @param  {String} dimensionType
   *         The grid dimension type which is either the constant COLUMNS or ROWS.
   */
  renderGridLineNumber(lineNumber, linePos, startPos, dimensionType) {
    let { devicePixelRatio } = this.win;
    let displayPixelRatio = getDisplayPixelRatio(this.win);
    let x = Math.round(this._canvasPosition.x * devicePixelRatio);
    let y = Math.round(this._canvasPosition.y * devicePixelRatio);

    linePos = Math.round(linePos * devicePixelRatio);
    startPos = Math.round(startPos * devicePixelRatio);

    this.ctx.save();
    this.ctx.translate(.5 - x, .5 - y);

    let fontSize = (GRID_FONT_SIZE * displayPixelRatio);
    this.ctx.font = fontSize + "px " + GRID_FONT_FAMILY;

    let textWidth = this.ctx.measureText(lineNumber).width;

    if (dimensionType === COLUMNS) {
      let yPos = Math.max(startPos, fontSize);
      this.ctx.fillText(lineNumber, linePos, yPos);
    } else {
      let xPos = Math.max(startPos, textWidth);
      this.ctx.fillText(lineNumber, xPos - textWidth, linePos);
    }

    this.ctx.restore();
  },

  /**
   * Render the grid gap area on the css grid highlighter canvas.
   *
   * @param  {Number} linePos
   *         The line position along the x-axis for a column grid line and
   *         y-axis for a row grid line.
   * @param  {Number} startPos
   *         The start position of the cross side of the grid line.
   * @param  {Number} endPos
   *         The end position of the cross side of the grid line.
   * @param  {Number} breadth
   *         The grid line breadth value.
   * @param  {String} dimensionType
   *         The grid dimension type which is either the constant COLUMNS or ROWS.
   */
  renderGridGap(linePos, startPos, endPos, breadth, dimensionType) {
    let { devicePixelRatio } = this.win;
    let x = Math.round(this._canvasPosition.x * devicePixelRatio);
    let y = Math.round(this._canvasPosition.y * devicePixelRatio);

    linePos = Math.round(linePos * devicePixelRatio);
    startPos = Math.round(startPos * devicePixelRatio);
    breadth = Math.round(breadth * devicePixelRatio);

    this.ctx.save();
    this.ctx.fillStyle = this.getGridGapPattern(devicePixelRatio, dimensionType);
    this.ctx.translate(.5 - x, .5 - y);

    if (dimensionType === COLUMNS) {
      endPos = isFinite(endPos) ? Math.round(endPos * devicePixelRatio) : CANVAS_SIZE + y;
      this.ctx.fillRect(linePos, startPos, breadth, endPos - startPos);
    } else {
      endPos = isFinite(endPos) ? Math.round(endPos * devicePixelRatio) : CANVAS_SIZE + x;
      this.ctx.fillRect(startPos, linePos, endPos - startPos, breadth);
    }
    this.ctx.restore();
  },

  /**
   * Render the grid area highlight for the given area name or for all the grid areas.
   *
   * @param  {String} areaName
   *         Name of the grid area to be highlighted. If no area name is provided, all
   *         the grid areas should be highlighted.
   */
  renderGridArea(areaName) {
    let paths = [];
    let currentZoom = getCurrentZoom(this.win);

    for (let i = 0; i < this.gridData.length; i++) {
      let fragment = this.gridData[i];
      let {bounds} = this.currentQuads.content[i];

      for (let area of fragment.areas) {
        if (areaName && areaName != area.name) {
          continue;
        }

        let rowStart = fragment.rows.lines[area.rowStart - 1];
        let rowEnd = fragment.rows.lines[area.rowEnd - 1];
        let columnStart = fragment.cols.lines[area.columnStart - 1];
        let columnEnd = fragment.cols.lines[area.columnEnd - 1];

        let x1 = columnStart.start + columnStart.breadth +
          (bounds.left / currentZoom);
        let x2 = columnEnd.start + (bounds.left / currentZoom);
        let y1 = rowStart.start + rowStart.breadth +
          (bounds.top / currentZoom);
        let y2 = rowEnd.start + (bounds.top / currentZoom);

        let path = "M" + x1 + "," + y1 + " " +
                   "L" + x2 + "," + y1 + " " +
                   "L" + x2 + "," + y2 + " " +
                   "L" + x1 + "," + y2;
        paths.push(path);

        // Update and show the info bar when only displaying a single grid area.
        if (areaName) {
          this._updateGridAreaInfobar(area, x1, x2, y1, y2);
          this._showGridAreaInfoBar();
        }
      }
    }

    let areas = this.getElement("areas");
    areas.setAttribute("d", paths.join(" "));
  },

  /**
   * Render the grid cell highlight for the given grid fragment index, row and column
   * number.
   *
   * @param  {Number} gridFragmentIndex
   *         Index of the grid fragment to render the grid cell highlight.
   * @param  {Number} rowNumber
   *         Row number of the grid cell to highlight.
   * @param  {Number} columnNumber
   *         Column number of the grid cell to highlight.
   */
  renderGridCell(gridFragmentIndex, rowNumber, columnNumber) {
    let fragment = this.gridData[gridFragmentIndex];

    if (!fragment) {
      return;
    }

    let row = fragment.rows.tracks[rowNumber - 1];
    let column = fragment.cols.tracks[columnNumber - 1];

    if (!row || !column) {
      return;
    }

    let currentZoom = getCurrentZoom(this.win);
    let {bounds} = this.currentQuads.content[gridFragmentIndex];

    let x1 = column.start + (bounds.left / currentZoom);
    let x2 = column.start + column.breadth + (bounds.left / currentZoom);
    let y1 = row.start + (bounds.top / currentZoom);
    let y2 = row.start + row.breadth + (bounds.top / currentZoom);

    let path = "M" + x1 + "," + y1 + " " +
               "L" + x2 + "," + y1 + " " +
               "L" + x2 + "," + y2 + " " +
               "L" + x1 + "," + y2;
    let cells = this.getElement("cells");
    cells.setAttribute("d", path);

    this._updateGridCellInfobar(rowNumber, columnNumber, x1, x2, y1, y2);
    this._showGridCellInfoBar();
  },

  /**
   * Hide the highlighter, the canvas and the infobars.
   */
  _hide() {
    setIgnoreLayoutChanges(true);
    this._hideGrid();
    this._hideGridElements();
    this._hideGridAreaInfoBar();
    this._hideGridCellInfoBar();
    setIgnoreLayoutChanges(false, this.highlighterEnv.document.documentElement);
  },

  _hideGrid() {
    this.getElement("canvas").setAttribute("hidden", "true");
  },

  _showGrid() {
    this.getElement("canvas").removeAttribute("hidden");
  },

  _hideGridElements() {
    this.getElement("elements").setAttribute("hidden", "true");
  },

  _showGridElements() {
    this.getElement("elements").removeAttribute("hidden");
  },

  _hideGridAreaInfoBar() {
    this.getElement("area-infobar-container").setAttribute("hidden", "true");
  },

  _showGridAreaInfoBar() {
    this.getElement("area-infobar-container").removeAttribute("hidden");
  },

  _hideGridCellInfoBar() {
    this.getElement("cell-infobar-container").setAttribute("hidden", "true");
  },

  _showGridCellInfoBar() {
    this.getElement("cell-infobar-container").removeAttribute("hidden");
  },

});

exports.CssGridHighlighter = CssGridHighlighter;
