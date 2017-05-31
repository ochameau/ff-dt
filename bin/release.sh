#!/bin/bash

set -e

# Ensure NOT printing commands
set +x

# /!\ This script handles private keys /!\
# Be careful to not leak them and only execute this
# on safe branch, controlled by core contributors only.
#
# Otherwise, this script signs the add-on via AMO
# and then pushes it to S3 to appear on archive.mozilla.org
# Secrets are managed on this page:
# https://tools.taskcluster.net/secrets/

SCRIPT_DIR=$(dirname $0)

# Import AMO credentials from taskcluster secrets
# only master branch can access them to prevent unauthorized contributors
# accessing them via pull requests
export secret_url="http://taskcluster/secrets/v1/secret/repo:github.com/ochameau/ff-dt:branch:master"
export AMO_USER=$(curl ${secret_url} | jq ".secret.AMO_USER" -r)
export AMO_SECRET=$(curl ${secret_url} | jq ".secret.AMO_SECRET" -r)

# Append a unique (at least if we don't push twice per minute to master branch...)
# version prefix to the addon id as AMO requires new addon version for every upload
# and also require it to be greater.
# /!\ this changes install.rdf without commiting it.
VERSION_SUFFIX=$(date +%Y%m%d%H%M)
sed -i -E 's/em:version=\"([0-9.ab-]+)\"/em:version=\"\1.'$VERSION_SUFFIX'\"/g' install.rdf

$SCRIPT_DIR/build-xpi.sh
# Note that sign.sh is downloading the xpi from AMO
# we may just hand over AMO link to github...
$SCRIPT_DIR/sign.sh devtools.xpi

# If we don't push to S3, we can expose a stable taskcluster api like this:
# This URL is based on the route declared in taskcluster.yml or task-definitions.yml
# ROUTE=project.devtools.revisions.$GITHUB_HEAD_REPO_SHA.sign
# ADDON_URL=https://index.taskcluster.net/v1/task/$ROUTE/artifacts/public/devtools-signed.xpi

# Upload the xpi to S3
export AWS_ACCESS_KEY_ID=$(curl ${secret_url} | jq ".secret.AWS_ACCESS_KEY_ID" -r)
export AWS_SECRET_ACCESS_KEY=$(curl ${secret_url} | jq ".secret.AWS_SECRET_ACCESS_KEY" -r)
S3_ROOT_PATH="/pub/labs/devtools/master"
S3_BASE_URL="s3://net-mozaws-prod-delivery-contrib$S3_ROOT_PATH"
aws s3 cp devtools-signed.xpi $S3_BASE_URL/devtools.xpi
ADDON_URL="https://archive.mozilla.org/pub/labs/devtools/master/devtools.xpi"

# Post a commit status message to github with a link to the signed add-on
URL="http://taskcluster/github/v1/repository/ochameau/ff-dt/statuses/$GITHUB_HEAD_REPO_SHA"
JSON="{\"state\":\"success\", \"description\":\"Signed add-on\", \"target_url\": \"$ADDON_URL\", \"context\": \"add-on\"}"
curl $URL -H "Content-Type: application/json" -X POST -d "$JSON"
