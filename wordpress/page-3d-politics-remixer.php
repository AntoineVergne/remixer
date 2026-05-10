<?php
/**
 * Template Name: 3D Politics Remixer
 *
 * Setup:
 * 1. Copy this file into your theme directory (next to index.php).
 * 2. Copy the contents of dist/ into your-theme/3d-politics-remixer/.
 * 3. In WordPress admin, create a Page and set Template → "3D Politics Remixer".
 */

$app_dir      = get_template_directory() . '/3d-politics-remixer';
$app_url      = get_template_directory_uri() . '/3d-politics-remixer';
$manifest_path = $app_dir . '/.vite/manifest.json';

if ( ! file_exists( $manifest_path ) ) {
    wp_die(
        'App assets not found. Copy the contents of dist/ into ' .
        get_template_directory() . '/3d-politics-remixer/'
    );
}

$manifest = json_decode( file_get_contents( $manifest_path ), true );
$entry    = $manifest['index.html'] ?? null;

get_header();
?>
<div id="root"></div>
<?php
if ( $entry ) {
    foreach ( $entry['css'] ?? [] as $css_file ) {
        printf(
            '<link rel="stylesheet" href="%s">' . "\n",
            esc_url( $app_url . '/' . $css_file )
        );
    }
    printf(
        '<script type="module" src="%s"></script>' . "\n",
        esc_url( $app_url . '/' . $entry['file'] )
    );
}
get_footer();
