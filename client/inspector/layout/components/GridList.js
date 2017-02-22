/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { addons, createClass, createFactory, DOM: dom, PropTypes } =
  require("devtools/client/shared/vendor/react");

const GridItem = createFactory(require("./GridItem"));

const Types = require("../types");
const { getStr } = require("../utils/l10n");

module.exports = createClass({

  displayName: "GridList",

  propTypes: {
    getSwatchColorPickerTooltip: PropTypes.func.isRequired,
    grids: PropTypes.arrayOf(PropTypes.shape(Types.grid)).isRequired,
    onSetGridOverlayColor: PropTypes.func.isRequired,
    onToggleGridHighlighter: PropTypes.func.isRequired,
  },

  mixins: [ addons.PureRenderMixin ],

  render() {
    let {
      getSwatchColorPickerTooltip,
      grids,
      onSetGridOverlayColor,
      onToggleGridHighlighter,
    } = this.props;

    return dom.div(
      {
        className: "grid-container",
      },
      dom.span(
        {},
        getStr("layout.overlayGrid")
      ),
      dom.ul(
        {},
        grids.map(grid => GridItem({
          getSwatchColorPickerTooltip,
          grid,
          onSetGridOverlayColor,
          onToggleGridHighlighter,
        }))
      )
    );
  },

});
