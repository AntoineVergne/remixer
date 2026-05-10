<?php
/**
 * Add this snippet to your theme's functions.php.
 *
 * Removes WordPress emoji scripts and the embed widget on the Remixer
 * page to avoid JS conflicts with the React app.
 */
add_action( 'wp_enqueue_scripts', function () {
    if ( ! is_page_template( 'page-3d-politics-remixer.php' ) ) {
        return;
    }
    remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
    remove_action( 'wp_print_styles', 'print_emoji_styles' );
    wp_dequeue_script( 'wp-embed' );
} );
