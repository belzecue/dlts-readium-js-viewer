"use strict";

let assert = require( 'chai' ).assert;

let readium = require( '../pageobjects/readium.page' );

// The trailing "&" is often put there by Readium and browser, so using it here, too.
const BY_ANY_MEDIA_NECESSARY_PATH = '/?epub=epub_content%2F9781479899982&epubs=epub_content%2Fepub_library.json&';
const JAPANESE_LESSONS_PATH       = '/?epub=epub_content%2F9780814712917&epubs=epub_content%2Fepub_library.json&';

suite( 'Book cover', function() {

    this.retries( 3 );

    // OA Book covers are <svg>, Connected Youth book covers are <img>
    // We use different fixes for each.

    test( 'OA Books cover should be absolutely positioned to prevent splitting', function() {
        readium.open( JAPANESE_LESSONS_PATH );

        let bookCoverPosition = readium.bookCoverImageSvg.position;

        assert.equal( bookCoverPosition, 'absolute', '<svg> is absolutely positioned' );
    } );

    suite( 'Connected Youth cover', function() {
        let bookCoverImage;
        let expectedValue = {
            height:    undefined,
            maxHeight: undefined,
            maxWidth:  undefined,
            width:     undefined,
        };

        suiteSetup( function() {
            readium.open( BY_ANY_MEDIA_NECESSARY_PATH );

            bookCoverImage = readium.bookCoverImageImg;

            // We've specified the properties mostly using proportions, but
            // WebdriverIO in almost all cases returns calculated pixel values
            // which differ depending on the browser.  Furthermore, the values
            // seem to change depending on where the tests are run from.
            // For example, running the tests from the Mac OS X Terminal
            // program and running them from the terminal panel in Intellij
            // produced different values.
            //
            // So need to calculate the expected values anew for each test run.
            // This is what we specify in our CSS:
            //
            //     height:    '93vh'
            //     maxHeight: '93vh'
            //     maxWidth:  '98%'
            //     width:     'auto'
            //
            // Do the expected value assignments here instead of individually
            // in the tests so that if we need to add browsers later it will be
            // less work.

            let vh = readium.vh;
            const expectedNumberOfVh = 93;

            expectedValue.height    = Math.floor( expectedNumberOfVh * vh );
            expectedValue.maxHeight = Math.floor( expectedNumberOfVh * vh );

            let browserName = browser.options.desiredCapabilities.browserName;

            if ( browserName === 'chrome' ) {
                expectedValue.maxWidth = '98%';

                // width: auto is broken in Chrome.  See comment in else if
                // block.
                expectedValue.width = undefined;
            } else if ( browserName = 'firefox' ) {
                expectedValue.maxWidth = Math.floor(
                    readium.bookCoverImageImgEnclosingElementWidth * 0.98
                );

                // Aspect ratio for the cover being tested is 2:3 (600px x 900px).
                // width: auto for <img> tags indicates that width should be
                // set so that aspect ratio is maintained.
                // Note that this only seems to work in Firefox, so we won't
                // test width in Chrome, where the image is distorted on load
                // (the aspect ratio was 404px to 783px).
                expectedValue.width = Math.floor(
                    parseInt(
                        bookCoverImage.height.substring( 0, 3 )
                    ) * 2 / 3
                );
            } else {
                console.log( 'Should never get here.' );
            }

        } );

        test( '"height"', function() {
            assert.equal( bookCoverImage.height.substring( 0, 3 ), expectedValue.height );
        } );

        test( '"max-height"', function() {
            assert.equal( bookCoverImage.maxHeight.substring( 0, 3 ), expectedValue.maxHeight );
        } );

        test( '"max-width"', function() {
            assert.equal( bookCoverImage.maxWidth.substring( 0, 3 ), expectedValue.maxWidth );
        } );

        // We are not testing width for every browser.  See comments in
        // suiteSetup().
        if ( expectedValue.width ) {
            test( '"width"', function() {
                assert.equal( bookCoverImage.width.substring( 0, 3 ), expectedValue.width );
            } );
        }

    } );

} );
