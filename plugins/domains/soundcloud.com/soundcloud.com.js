const $ = require('cheerio');
const querystring = require('querystring');
const URL = require("url");

module.exports = {

    provides: ['__allow_soundcloud_meta', 'sound_count'],

    mixins: [
        "oembed-title",
        "oembed-site",
        "oembed-author",
        "oembed-description",
        // do not link to meta as it disables support for direct player urls redirects from w.soundcloud.com
        "domain-icon"
    ],

    getLink: function(oembed, sound_count, options) {

        var $container = $('<div>');
        try {
            $container.html(oembed.html);
        } catch (ex) {}

        var $iframe = $container.find('iframe');
        var links = [];

        if ($iframe.length == 1 && sound_count !== 0) {

            var href = $iframe.attr('src');
            var params = URL.parse(href, true).query;

            if (options.getRequestOptions('players.horizontal', options.getProviderOptions('soundcloud.old_player') || options.getProviderOptions(CONFIG.O.less))) {
                params.visual = false;
            }
            if (options.getRequestOptions('soundcloud.hide_comments') !== undefined) {
                params.show_comments = !options.getRequestOptions('soundcloud.hide_comments');
            }
            if (options.getRequestOptions('soundcloud.hide_artwork') !== undefined) {
                params.show_artwork = !options.getRequestOptions('soundcloud.hide_artwork');
            }            
            if (options.getProviderOptions('soundcloud.color')) {
                params.color = options.getProviderOptions('soundcloud.color');
            }

            href = href.replace(/\?.+/, '') + querystring.stringify(params).replace(/^(.)/, '?$1');
            var height = options.getRequestOptions('soundcloud.height', options.getProviderOptions('players.horizontal') === false ? 'auto' : (/visual=false/.test(href) ? 166 : oembed.height));

            var opts = {
                horizontal: {
                    label: CONFIG.L.horizontal,
                    value: /visual=false/.test(href)
                },
                hide_comments: {
                    label: 'Hide timed comments',
                    value: /show_comments=false/.test(href)
                },
                hide_artwork : {
                    label: CONFIG.L.hide_artwork,
                    value: /show_artwork=false/.test(href)
                },
                height: {
                    label: CONFIG.L.height,
                    value: height,
                    values: {
                        300: '300px',
                        400: '400px',
                        600: '600px',
                        auto: 'Let Iframely optimize player for the artwork'
                    }
                }
            };
            if (height !== 'auto') {
                opts.height.values[height] = height + 'px';
            }

            if (/visual=true/.test(href)) {
                delete opts.hide_artwork;
            } else {
                delete opts.height;
            }

            links.push({
                href: href,
                type: CONFIG.T.text_html,
                rel: [CONFIG.R.player, CONFIG.R.audio, CONFIG.R.html5],
                autoplay: "auto_play=true",
                media: height === 'auto' ? {
                    'aspect-ratio': 1, // the artwork is always 500x500
                    'max-width': 600, 
                } : {
                    height: /visual=false/.test(href) ? 166 : height
                },
                options: opts
            });
        }

        if (oembed.thumbnail_url && !/\/images\/fb_placeholder\.png/.test(oembed.thumbnail_url)) {
            links.push({
                href: oembed.thumbnail_url,
                type: CONFIG.T.image,
                rel: [CONFIG.R.thumbnail, CONFIG.R.oembed],
                width: oembed.thumbnail_width,
                height: oembed.thumbnail_height
            });
        }

        return links;
    },

    getData: function (url, oembed) {
        if (
            /* Don't request meta for w.soundcloud.com widget redirects, html parser gets 401 there. */
            !/w\.soundcloud\.com/i.test(url)
            && (
                /* Skip the placeholder thumbnail in oEmbed - use user picture in og image instead. */
                !oembed.thumbnail_url || /\/images\/fb_placeholder\.png/.test(oembed.thumbnail_url)
                
                /* Also, check meta and try to exclude user profiles with 0 tracks. */
                || /api\.soundcloud\.com(%2F|\/)users(%2F|\/)/i.test(oembed.html)
            )
        ) {
            return {
                __allow_soundcloud_meta: true
            }
            
        } else {
            /* Ignore fallbacks, go directly to regular flow */
            return {
                sound_count: 1
            }
        }
    },

    tests: [{skipMethods: ["getData"]}, {skipMixins: ["oembed-description"]},
        "https://soundcloud.com/posij/sets/posij-28-hz-ep-division",
        "https://soundcloud.com/user-847444"
        // user profile with no tracks: https://soundcloud.com/mata-klol        
    ]
};
