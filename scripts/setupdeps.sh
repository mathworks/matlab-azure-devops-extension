#!/bin/bash

RMC_BASE_URL='https://ssd.mathworks.com/supportfiles/ci/run-matlab-command'
RMC_VERSIONS=('v1' 'v2')
SUPPORTED_OS=('win64' 'maci64' 'glnxa64')

# Create dist directory if it doesn't already exist
DISTDIR="$(pwd)/_package/bin"
mkdir -p $DISTDIR

# Download and extract in a temporary directory
WORKINGDIR=$(mktemp -d -t rmc_build.XXXXXX)
cd $WORKINGDIR

for rmc_version in ${RMC_VERSIONS[@]}
do
mkdir -p "$WORKINGDIR/$rmc_version"
wget -O  "$WORKINGDIR/$rmc_version/license.txt" "$RMC_BASE_URL/$rmc_version/license.txt"
wget -O  "$WORKINGDIR/$rmc_version/thirdpartylicenses.txt" "$RMC_BASE_URL/$rmc_version/thirdpartylicenses.txt"

    for os in ${SUPPORTED_OS[@]}
    do
        if [[ $os == 'win64' ]] ; then
            bin_ext='.exe'
        else
            bin_ext=''
        fi
        mkdir -p "$WORKINGDIR/$rmc_version/$os"
        wget -O  "$WORKINGDIR/$rmc_version/$os/run-matlab-command$bin_ext" "$RMC_BASE_URL/$rmc_version/$os/run-matlab-command$bin_ext"
    done
done

mv -f ./* "$DISTDIR/"
rm -rf $WORKINGDIR
