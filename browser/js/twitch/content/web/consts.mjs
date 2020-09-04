'use strict';

export const TWITCH_PATTERN = '*://*.twitch.tv/*';
export const TWITCH_KRAKEN = 'https://api.twitch.tv/kraken';
export const TWITCH_LINK = 'https://www.twitch.tv'
export const TWITCH_CLIENT_ID = 'mcuge7d598c9v5v5r9e6u34iwem0vqb';
export const TWITCH_FETCH_INIT = {headers: {'Client-ID': TWITCH_CLIENT_ID, 'Accept': 'application/vnd.twitchtv.v5+json'}};

export const EXTENSION_CLASS_PREFIX = 'eetau';
export const EXTENSION_VAR_PREFIX = 'eetau';

export const PAGE_LOAD_TIMEOUT = 30000;

export const INSIDES_LOAD_TIMEOUT = 50;

export const DEV_MODE = false;

export const DEFAULT_SETTINGS = {
    CUSTOM_TIMESTAMPS_SETTINGS: {
        timestamp_format: '%H:%M',
        tooltip_timestamp_format: '%Y.%m.%d %H:%M:%S.%ms',
        force_enable: false,
        prevent_chat_badge_selection: true
    },
    PLAYER_CONTROLS_SETTINGS: {
        prevent_conflicts: true,
        seek_interval: 10,
        seek_interval_with_shift: 30,
        keys: {
            fullscreen_toggle: 'KeyF',
            mute_toggle: 'KeyM',
            pause_toggle: 'KeyK',
            seek_forwards: 'KeyL',
            seek_backwards: 'KeyJ',
            theatre_toggle: 'KeyT',
            video_stats: 'KeyI',
            ad_stats: null,
            latency_mode: null,
            left_side_toggle: 'BracketLeft',
            right_side_toggle: 'BracketRight',
            speed_up: 'Period',
            speed_down: 'Comma',
            quality_up: 'Equal',
            quality_down: 'Minus'
        }
    },
    CHATLOG_FROM_VOD_SETTINGS: {
        messages_amount: 12
    }
}

export const DEFAULT_STORAGE = {
    SYNC: {
        settings: {
            twitch: {
                chat: {
                    show_video_playback: true,
                    custom_timestamps: true,
                    custom_timestamps_settings: DEFAULT_SETTINGS.CUSTOM_TIMESTAMPS_SETTINGS,
                    community_points_settings: {
                        auto_claim_bonus: false
                    },
                    auto_leave_raids: false,
                    chatlog_from_vod: true,
                    chatlog_from_vod_settings: DEFAULT_SETTINGS.CHATLOG_FROM_VOD_SETTINGS,
                    always_reply: true
                },
                player: {
                    controls: true,
                    controls_settings: DEFAULT_SETTINGS.PLAYER_CONTROLS_SETTINGS
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
                    volume: 1,
                    apply_window_position: false,
                    window_position: {left: 0, top: 0}
                },
                popout_chat: {
                    window_size: {width: 400, height: 720},
                    apply_window_position: false,
                    window_position: {left: 0, top: 0}
                },
                popout_using_windows_api: true
            }
        },
        cache: {
            viewport_size_offset: {
                x: 0, y: 0
            }
        }
    }
}
