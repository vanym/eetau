'use strict';

export const EXTENSION_CLASS_PREFIX = 'eetau';
export const EXTENSION_VAR_PREFIX = 'eetau';

export const PAGE_LOAD_TIMEOUT = 30000;

export const DEV_MODE = false;

export const DEFAULT_SETTINGS = {
    CUSTOM_TIMESTAMPS_SETTINGS: {
        timestamp_format: '%H:%M',
        force_enable: false
    }
}

export const DEFAULT_STORAGE = {
    SYNC: {
        settings: {
            twitch: {
                chat: {
                    show_video_playback: true,
                    custom_timestamps: true,
                    custom_timestamps_settings: DEFAULT_SETTINGS.CUSTOM_TIMESTAMPS_SETTINGS
                },
                popout_chat: {
                    change_title: true,
                    title: "%title% Chat %channel%",
                    add_channel_link: true
                },
                popout_player: {
                    change_title: true,
                    title_channel: "%title% Player %channel%",
                    title_video: "%title% Player Video %video_id%"
                }
            }
        }
    },
    LOCAL: {
        settings: {
            twitch: {
                popout_player: {
                    default_resolution: {width: 1280, height: 720},
                    fixed_size: false,
                    apply_volume: false,
                    volume: 1
                },
                popout_chat: {
                    window_size: {width: 400, height: 720}
                }
            }
        },
        cache: {
            viewport_size_offset: {
                x: 0, y: 0
            }
        }
    }
}
