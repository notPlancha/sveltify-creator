$pathToTestOn = $null

$start = (Get-Location).Path
cd $pathToTestOn
yarn run build
del "$pathToTestOn\node_modules\sveltify-creator\dist\" -Force -Recurse
cp .\dist\ "$pathToTestOn\node_modules\sveltify-creator\dist\" -Recurse
cd $pathToTestOn
npm run build-local
cd $start