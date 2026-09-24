/**
 * =============================================================================
 * 🎨 RETRO TREASURE HUNT - CUSTOM ASSET REGISTRY & INTEGRATION SETTINGS
 * =============================================================================
 * You can customize all pixel art sprites and assets used in the game here.
 * 
 * HOW TO USE YOUR OWN PIXEL ART ASSETS:
 * 1. Place your pixel art images (.png, .webp, or .gif) in the public/assets folder:
 *      public/assets/chest_closed.png
 *      public/assets/chest_locked_glow.png
 *      public/assets/chest_open.png
 *      public/assets/scroll_rolled.png
 *      public/assets/parchment_unrolled.png
 *      public/assets/bomb_1.png .. bomb_4.png
 *      public/assets/items/<item_id>.png
 * 2. Or override the paths / URLs directly in the ASSET_CONFIG object below.
 * 3. FALLBACK SAFETY: If any custom file is missing or fails to load on older
 *    devices, the engine automatically falls back to lightweight, zero-latency
 *    embedded pixel-art vectors, guaranteeing ZERO broken images!
 * =============================================================================
 */

window.ASSET_CONFIG = {
    // Single Chest Sprites (Direct / Fallback)
    chest_closed: 'assets/chest_open/chest_open_1.png',
    chest_locked_glow: 'assets/chest_idle/chest_glow_1.png',
    chest_open: 'assets/chest_open/chest_open_12.png',

    // 6-Frame Seamless Chest Idle / Glow Loop (When chest is awaiting player tap)
    chest_glow_frames: [
        'assets/chest_idle/chest_glow_1.png',
        'assets/chest_idle/chest_glow_2.png',
        'assets/chest_idle/chest_glow_3.png',
        'assets/chest_idle/chest_glow_4.png',
        'assets/chest_idle/chest_glow_5.png',
        'assets/chest_idle/chest_glow_6.png',
        'assets/chest_idle/chest_glow_7.png',
        'assets/chest_idle/chest_glow_8.png',
        'assets/chest_idle/chest_glow_9.png',
        'assets/chest_idle/chest_glow_10.png'
              
    ],
    chest_glow_frame_ms: 150, // 150ms per frame = smooth ~900ms breathing pulse loop

    // 6-Frame Chest Opening Sequence (Plays smoothly when player taps to open)
    chest_open_frames: [
        'assets/chest_open/chest_open_1.png',
        'assets/chest_open/chest_open_2.png',
        'assets/chest_open/chest_open_3.png',
        'assets/chest_open/chest_open_4.png',
        'assets/chest_open/chest_open_5.png',
        'assets/chest_open/chest_open_6.png',
        'assets/chest_open/chest_open_7.png',
        'assets/chest_open/chest_open_8.png',
        'assets/chest_open/chest_open_9.png',
        'assets/chest_open/chest_open_10.png',
        'assets/chest_open/chest_open_11.png',
        'assets/chest_open/chest_open_12.png'
        ],
    chest_open_frame_ms: 50, // 110ms per frame = ~660ms opening sequence

    // Scroll & Parchment Sprites
    scroll_rolled: 'assets/scroll_rolled.png',
    parchment_unrolled: 'assets/parchment_unrolled.png',

    // 12+ Frame Bomb Explosion Sequence
    // You can customize or add more frames here (e.g. 12, 16, 20+ frames)!
    bomb_frames: [
        'assets/bomb_1.png',
        'assets/bomb_2.png',
        'assets/bomb_3.png',
        'assets/bomb_4.png',
        'assets/bomb_5.png',
        'assets/bomb_6.png',
        'assets/bomb_7.png',
        'assets/bomb_8.png',
        'assets/bomb_9.png',
        'assets/bomb_10.png',
        'assets/bomb_11.png',
        'assets/bomb_12.png',
        'assets/bomb_13.png'
        ],
    bomb_frame_ms: 200, // Frame duration during explosion build-up. Lower = faster animation, higher = slower.
    bomb_fullscreen_last_frame: false, // TRUE: the final frame covers the entire screen. FALSE (default): sprite stays normal size, screen shake alone sells the impact.
    bomb_last_frame_ms: 700, // Duration the final frame lingers before showing the penalty message

    // 🔊 BOMB SOUND — leave the _sound paths as null to use the built-in
    // lightweight synthesized sounds (no audio files, generated instantly
    // via Web Audio — zero extra network requests). Point either one at your
    // own file (mp3/wav/ogg, e.g. 'assets/sfx/fuse.mp3') to override it; the
    // file is only fetched the first time it actually plays, then cached.
    // _frame is 0-indexed and matches bomb_frames above — e.g. fuse at frame
    // 0 fires as soon as the frame sequence starts (right as the bomb lands).
    bomb_fuse_sound: 'public/sfx/Fuse.mp3',
    bomb_fuse_sound_frame: 0,
    bomb_explosion_sound: 'public/sfx/Explosion.mp3',
    bomb_explosion_sound_frame: 8,

    // 📸 SCREEN SHAKE — which frame (0-indexed) triggers the heavy rumble.
    // Example: 12 frames total (indices 0-11), shake_start_frame: 7 means
    // the shake kicks in on the 8th frame (bomb_8.png) and runs through
    // to the end of the sequence. If you add/remove frames above, just
    // change this number — it doesn't need to match bomb_frames.length.
    bomb_shake_start_frame: 7,

    // 🚩 RED FLASH — fires once, right after the explosion frames finish
    // playing (see student.js, playBombSequence). Set to false to disable
    // the flash entirely.
    bomb_flash_enabled: true,

    // Loot Item Sprites
    items: {
        // Common
        sandalswallow: 'assets/items/sandalswallow.png',
        snek: 'assets/items/snek.png',
        es_teh_manis: 'assets/items/es_teh_manis.png',

        // Rare
        parfum: 'assets/items/parfum.png',
        dasi: 'assets/items/dasi.png',
        kunci: 'assets/items/kunci.png',

        // Epic
        router: 'assets/items/router.png',
        TWSkaumhave: 'assets/items/TWSkaumhave.png',
        chargerhp: 'assets/items/chargerhp.png',
        micpenaikihsg: 'assets/items/micpenaikihsg.png',

        // Legendary
        kopyah: 'assets/items/kopyah.png',
        hpkuat: 'assets/items/hpkuat.png',
        kamerabunabila: 'assets/items/kamerabunabila.png',

        // Mythic
        mahkota: 'assets/items/mahkota.png',
        buku_ala_ala: 'assets/items/buku_ala_ala.png',
        ijazah: 'assets/items/ijazah.png',
        malapangankerja: 'assets/items/malapangankerja.png'
    },

    // Audio SFX Configuration
    audioEnabled: true
};

// =============================================================================
// PROCEDURAL PIXEL ART FALLBACK GENERATOR (ZERO-LATENCY, ZERO 404s)
// =============================================================================
(function () {
    // Generate crisp 16x16 / 32x32 SVG pixel art data URIs
    function createPixelSvg(width, height, pixels, palette) {
        let rects = '';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const colorCode = pixels[y] ? pixels[y][x] : ' ';
                if (colorCode && palette[colorCode]) {
                    rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[colorCode]}"/>`;
                }
            }
        }
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${rects}</svg>`;
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }

    // Palette: warm nostalgic retro colors
    const P = {
        '#': '#1b120c', // Dark outline
        'D': '#3e2716', // Dark wood
        'M': '#6e4423', // Mid wood
        'L': '#a8733a', // Light wood
        'G': '#f5c253', // Gold metal
        'g': '#b8860b', // Dark gold
        'Y': '#fff275', // Highlight gold
        'R': '#d32f2f', // Red
        'r': '#8b0000', // Dark red
        'W': '#ffffff', // White
        'P': '#eedcb4', // Parchment cream
        'p': '#cbb085', // Dark parchment
        'O': '#ff8c00', // Orange
        'K': '#212121', // Iron/Charcoal
        'k': '#424242', // Grey
        'C': '#26c6da', // Cyan
        'E': '#4caf50', // Emerald green
        'e': '#1b5e20', // Dark green
        'B': '#3f51b5', // Blue
        'V': '#9c27b0'  // Purple
    };

    // 16x16 Chest Closed
    const chestClosedPixels = [
        "   ##########   ",
        "  #GGGGGGGGGG#  ",
        " #GLLLLLLLLLLG# ",
        "#GDDDDDDDDDDDDG#",
        "#GMDDMDDDMDMDDG#",
        "#GDDDDDDDDDDDDG#",
        "################",
        "#GLLLLLGGLMLLLG#",
        "#GDDDDDGGDDDDDG#",
        "#GMDDMDGGMDMDDG#",
        "#GMDDMD##MDMDDG#",
        "#GMDDMDGGMDMDDG#",
        "#GDDDDDGGDDDDDG#",
        "#GDDDDDDDDDDDDG#",
        " #GGGGGGGGGGGG# ",
        "  ############  "
    ];

    // =========================================================================
    // 6-FRAME SEAMLESS CHEST GLOW / IDLE LOOP (Breathing Golden Pulse)
    // =========================================================================
    const chestGlowFramesPixels = [
        // Frame 1: Base chest with modest gold metal band sheen
        [
            "   ##########   ",
            "  #GGGGGGGGGG#  ",
            " #GLLLLLLLLLLG# ",
            "#GDDDDDDDDDDDDG#",
            "#GMDDMDDDMDMDDG#",
            "#GDDDDDDDDDDDDG#",
            "################",
            "#GLLLLLGGLMLLLG#",
            "#GDDDDDGGDDDDDG#",
            "#GMDDMDGGMDMDDG#",
            "#GMDDMD##MDMDDG#",
            "#GMDDMDGGMDMDDG#",
            "#GDDDDDGGDDDDDG#",
            "#GDDDDDDDDDDDDG#",
            " #GGGGGGGGGGGG# ",
            "  ############  "
        ],
        // Frame 2: Golden brackets brighten, subtle warm ambient edge
        [
            "   #GGGGGGGG#   ",
            "  #GGYYYYYYGG#  ",
            " #GLLLLLLLLLLG# ",
            "#GDDDDDDDDDDDDG#",
            "#GMDDMDDDMDMDDG#",
            "#GDDDDDDDDDDDDG#",
            "#GGGGGGGGGGGGGG#",
            "#GLLLLLYYLMLLLG#",
            "#GDDDDDYGDDDDDG#",
            "#GMDDMDYYMDMDDG#",
            "#GMDDMD##MDMDDG#",
            "#GMDDMDYYMDMDDG#",
            "#GDDDDDYGDDDDDG#",
            "#GDDDDDDDDDDDDG#",
            " #GGGGGGGGGGGG# ",
            "  #GGGGGGGGGG#  "
        ],
        // Frame 3: Gold aura intensifies, keyhole glows yellow
        [
            "   YYYYYYYYYY   ",
            "  YGGYYYYYYGGY  ",
            " YGLLLLLLLLLLGY ",
            "YGDDDDDDDDDDDDGY",
            "YGMDDMDDDMDMDDGY",
            "YGDDDDDDDDDDDDGY",
            "YYYYYYYYYYYYYYYY",
            "YGLLLLLYYLMLLLGY",
            "YGDDDDDYDDDDDDGY",
            "YGMDDMDYYMDMDDGY",
            "YGMDDMD##MDMDDGY",
            "YGMDDMDYYMDMDDGY",
            "YGDDDDDYDDDDDDGY",
            "YGDDDDDDDDDDDDGY",
            " YGGGGGGGGGGGGY ",
            "  YYYYYYYYYYYY  "
        ],
        // Frame 4: PEAK PULSE - Radiant halo & sparkling corners
        [
            "  YYYYWWWWYYYY  ",
            " YYGGYYYYYYGGYY ",
            "YYGLLLLLLLLLLGYY",
            "YGDDDDDDDDDDDDGY",
            "YGMDDMDDDMDMDDGY",
            "YGDDDDDDDDDDDDGY",
            "WWYYYYYYYYYYYYWW",
            "YGLLLLLWWLMLLLGY",
            "YGDDDDDYYDDDDDG#",
            "YGMDDMDWWMDMDDG#",
            "YGMDDMD##MDMDDG#",
            "YGMDDMDWWMDMDDG#",
            "YGDDDDDYYDDDDDG#",
            "YGDDDDDDDDDDDDGY",
            " YYGGGGGGGGGGYY ",
            "  YYYYWWWWYYYY  "
        ],
        // Frame 5: Aura softens smoothly back down
        [
            "   YYYYYYYYYY   ",
            "  YGGYYYYYYGGY  ",
            " YGLLLLLLLLLLGY ",
            "YGDDDDDDDDDDDDGY",
            "YGMDDMDDDMDMDDGY",
            "YGDDDDDDDDDDDDGY",
            "YYYYYYYYYYYYYYYY",
            "YGLLLLLYYLMLLLGY",
            "YGDDDDDYDDDDDDGY",
            "YGMDDMDYYMDMDDGY",
            "YGMDDMD##MDMDDGY",
            "YGMDDMDYYMDMDDGY",
            "YGDDDDDYDDDDDDGY",
            "YGDDDDDDDDDDDDGY",
            " YGGGGGGGGGGGGY ",
            "  YYYYYYYYYYYY  "
        ],
        // Frame 6: Gentle amber warmth returning to Frame 1
        [
            "   #GGGGGGGG#   ",
            "  #GGYYYYYYGG#  ",
            " #GLLLLLLLLLLG# ",
            "#GDDDDDDDDDDDDG#",
            "#GMDDMDDDMDMDDG#",
            "#GDDDDDDDDDDDDG#",
            "#GGGGGGGGGGGGGG#",
            "#GLLLLLYYLMLLLG#",
            "#GDDDDDYGDDDDDG#",
            "#GMDDMDYYMDMDDG#",
            "#GMDDMD##MDMDDG#",
            "#GMDDMDYYMDMDDG#",
            "#GDDDDDYGDDDDDG#",
            "#GDDDDDDDDDDDDG#",
            " #GGGGGGGGGGGG# ",
            "  #GGGGGGGGGG#  "
        ]
    ];

    // =========================================================================
    // 6-FRAME CHEST OPENING SEQUENCE
    // =========================================================================
    const chestOpenFramesPixels = [
        // Frame 1: Lock unclasps with a white spark at keyhole
        [
            "   ##########   ",
            "  #GGGGGGGGGG#  ",
            " #GLLLLLLLLLLG# ",
            "#GDDDDDDDDDDDDG#",
            "#GMDDMDDDMDMDDG#",
            "#GDDDDDDDDDDDDG#",
            "################",
            "#GLLLLLGGLMLLLG#",
            "#GDDDDDGGDDDDDG#",
            "#GMDDMDWWMDMDDG#",
            "#GMDDMDWWMDMDDG#",
            "#GMDDMDGGMDMDDG#",
            "#GDDDDDGGDDDDDG#",
            "#GDDDDDDDDDDDDG#",
            " #GGGGGGGGGGGG# ",
            "  ############  "
        ],
        // Frame 2: Lid cracks open 1px, slit of golden treasure light escaping
        [
            "   ##########   ",
            "  #GGGGGGGGGG#  ",
            " #GLLLLLLLLLLG# ",
            "#GDDDDDDDDDDDDG#",
            "#GMDDMDDDMDMDDG#",
            "################",
            " YWWYYYYYYYYWWY ",
            "################",
            "#GLLLLLGGLMLLLG#",
            "#GDDDDDGGDDDDDG#",
            "#GMDDMDGGMDMDDG#",
            "#GMDDMD##MDMDDG#",
            "#GMDDMDGGMDMDDG#",
            "#GDDDDDGGDDDDDG#",
            " #GGGGGGGGGGGG# ",
            "  ############  "
        ],
        // Frame 3: Lid lifts 25°, golden light flare bursts outward
        [
            "  ############  ",
            " #GGGGGGGGGGGG# ",
            "#GLLLLLLLLLLLLG#",
            " ############## ",
            "  YYYYWWWWYYYY  ",
            " #YYYYYYYYYYYY# ",
            "################",
            "#GLLLLLGGLMLLLG#",
            "#GDDDDDGGDDDDDG#",
            "#GMDDMDGGMDMDDG#",
            "#GMDDMD##MDMDDG#",
            "#GMDDMDGGMDMDDG#",
            "#GDDDDDGGDDDDDG#",
            "#GDDDDDDDDDDDDG#",
            " #GGGGGGGGGGGG# ",
            "  ############  "
        ],
        // Frame 4: Lid lifts 50°, inside illuminates with glowing riches
        [
            " ############## ",
            "#GGGGGGGGGGGGGG#",
            "#GLLLLLLLLLLLLG#",
            " ############## ",
            "   YYYWWWWYYY   ",
            "  #YYYYYYYYYY#  ",
            "################",
            "#   YYYYYYYY   #",
            "#GLLLLLGGLMLLLG#",
            "#GDDDDDGGDDDDDG#",
            "#GMDDMDGGMDMDDG#",
            "#GMDDMD##MDMDDG#",
            "#GMDDMDGGMDMDDG#",
            "#GDDDDDDDDDDDDG#",
            " #GGGGGGGGGGGG# ",
            "  ############  "
        ],
        // Frame 5: Lid opens 75°, brilliant golden rays flare skyward
        [
            "################",
            "#GLLLLLLLLLLLLG#",
            " ############## ",
            "   Y   WW   Y   ",
            "  YYY YWWY YYY  ",
            " #YYYYYYYYYYYY# ",
            "################",
            "#  YYYYYYYYYY  #",
            "#GLLLLLGGLMLLLG#",
            "#GDDDDDGGDDDDDG#",
            "#GMDDMDGGMDMDDG#",
            "#GMDDMD##MDMDDG#",
            "#GMDDMDGGMDMDDG#",
            "#GDDDDDDDDDDDDG#",
            " #GGGGGGGGGGGG# ",
            "  ############  "
        ],
        // Frame 6: Lid fully open, radiant treasure aura & sparkles beaming upward
        [
            "  ############  ",
            " #GYYYYYYYYYYG# ",
            "#GYYWYYYYYYWYG# ",
            "#GYYYYYYYYYYYG# ",
            "################",
            "#   YYYYYYYY   #",
            "#GLLLLLGGLMLLLG#",
            "#GDDDDDGGDDDDDG#",
            "#GMDDMDGGMDMDDG#",
            "#GMDDMD##MDMDDG#",
            "#GMDDMDGGMDMDDG#",
            "#GDDDDDGGDDDDDG#",
            "#GDDDDDDDDDDDDG#",
            " #GGGGGGGGGGGG# ",
            "  ############  ",
            "                "
        ]
    ];

    // =========================================================================
    // 12-FRAME BOMB EXPLOSION (Culminating in full-screen blast coverage)
    // =========================================================================
    const bombFramesPixels = [
        // Frame 1: Lit bomb with burning fuse
        [
            "            Y   ",
            "           OYO  ",
            "          ##    ",
            "        ##      ",
            "      ######    ",
            "     #WWKKKK#   ",
            "    #WWKKKKKK#  ",
            "   #WKKKKKKKKK# ",
            "   #KKKKKKKKKK# ",
            "   #KKKKKKKKKK# ",
            "   #KKKKKKKKKK# ",
            "    #KKKKKKKK#  ",
            "     #KKKKKK#   ",
            "      ######    ",
            "                ",
            "                "
        ],
        // Frame 2: Fuse half-burned, flying spark
        [
            "           W Y  ",
            "         YROROY ",
            "          ##    ",
            "        ##      ",
            "      ######    ",
            "     #WWKKKK#   ",
            "    #WWKKKKKK#  ",
            "   #WKKKKKKKKK# ",
            "   #KKKKKKKKKK# ",
            "   #KKKKKKKKKK# ",
            "   #KKKKKKKKKK# ",
            "    #KKKKKKKK#  ",
            "     #KKKKKK#   ",
            "      ######    ",
            "                ",
            "                "
        ],
        // Frame 3: Fuse burns down to iron cap, sizzling sparks
        [
            "          Y W   ",
            "         WWOWW  ",
            "        # YOY # ",
            "        ######  ",
            "      ##########",
            "     #WWKKKKKKKK",
            "    #WWKKKKKKKKK",
            "   #WKKKKKKKKKK#",
            "   #KKKKKKKKKKK#",
            "   #KKKKKKKKKKK#",
            "   #KKKKKKKKKKK#",
            "    #KKKKKKKKK# ",
            "     #KKKKKKK#  ",
            "      ######    ",
            "                ",
            "                "
        ],
        // Frame 4: Shell turns red-orange, heat swelling
        [
            "        YWWY    ",
            "       WWOWW    ",
            "      ########  ",
            "     #RRRRRRRR# ",
            "    #ROOORRRRRR#",
            "   #ROOORRRRRRR#",
            "   #RRRRRRRRRRR#",
            "   #RRRRRRRRRRR#",
            "   #RRRRRRRRRRR#",
            "   #RRRRRRRRRRR#",
            "    #RRRRRRRRR# ",
            "     #RRRRRRR#  ",
            "      #######   ",
            "                ",
            "                ",
            "                "
        ],
        // Frame 5: Shell ruptures, intense yellow fissures cracking
        [
            "       YYYY     ",
            "     YYROORYY   ",
            "    #RRYYYYRRO# ",
            "   #ROYYYYYYORR#",
            "   #RYYYYYYYYRR#",
            "  #RRYYY##YYYRRO",
            "  #ROYY####YYOR#",
            "  #RRYY####YYRR#",
            "  #ROYYY##YYYOR#",
            "   #RYYYYYYYYRR#",
            "   #ROYYYYYYORR#",
            "    #RRYYYYRRO# ",
            "     YYROORYY   ",
            "       YYYY     ",
            "                ",
            "                "
        ],
        // Frame 6: Detonation core flash burst
        [
            "     Y  WW  Y   ",
            "    Y RWWWWWR Y ",
            "     RWWWWWWWR  ",
            "   W RWWWWWWWR W",
            "  WWWRWWWWWWWRWW",
            "  WWWWWWWWWWWWWW",
            "  WWWWWWWWWWWWWW",
            "  WWWRWWWWWWWRWW",
            "   W RWWWWWWWR W",
            "     RWWWWWWWR  ",
            "    Y RWWWWWR Y ",
            "     Y  WW  Y   ",
            "                ",
            "                ",
            "                ",
            "                "
        ],
        // Frame 7: Fireball blooms outward in jagged petals
        [
            "    O   YY   O  ",
            "   ORR YYYY RRO ",
            "  O RRRRYYYYRR O",
            "   RRRROOOORRRR ",
            "  ORRROO##OORRRO",
            "  YRROO####OORRY",
            "  YRRO######ORRY",
            "  ORRROO##OORRRO",
            "   RRRROOOORRRR ",
            "  O RRRRYYYYRR O",
            "   ORR YYYY RRO ",
            "    O   YY   O  ",
            "                ",
            "                ",
            "                ",
            "                "
        ],
        // Frame 8: Massive fiery inferno with flying shrapnel
        [
            "  Y O R WW R O Y",
            " O RRR YYYY RRRO",
            " R RRYYYYYYYRR R",
            "  RYYYWWWWYYYR  ",
            " RYYWWWWWWWWYYR ",
            "WYYWWWWWWWWWWYYW",
            "WYYWWWWWWWWWWYYW",
            " RYYWWWWWWWWYYR ",
            "  RYYYWWWWYYYR  ",
            " R RRYYYYYYYRR R",
            " O RRR YYYY RRRO",
            "  Y O R WW R O Y",
            "    O   YY   O  ",
            "                ",
            "                ",
            "                "
        ],
        // Frame 9: Giant expanding shockwave ring
        [
            " Y Y RROOOORR Y ",
            "Y RROOOOOOOOOR Y",
            " ROOOOOYYYYOOOOR",
            "ROOOOYYYYYYYYOOO",
            "OOOOYYY####YYYOO",
            "OOOYY########YYO",
            "OOOYY########YYO",
            "OOOOYYY####YYYOO",
            "ROOOOYYYYYYYYOOO",
            " ROOOOOYYYYOOOOR",
            "Y RROOOOOOOOOR Y",
            " Y Y RROOOORR Y ",
            "   O   RR   O   ",
            "                ",
            "                ",
            "                "
        ],
        // Frame 10: Billowing fiery clouds & thick black smoke
        [
            "K  R  Y WW Y  R ",
            " KRROOYWWWWYOOR ",
            " KROOYYYYYYYYOOR",
            "RROOYYWWWWWWYYOR",
            "ROOYYWWWWWWWWYYO",
            "OOYYWWWWWWWWWWYY",
            "OOYYWWWWWWWWWWYY",
            "ROOYYWWWWWWWWYYO",
            "RROOYYWWWWWWYYOR",
            " KROOYYYYYYYYOOR",
            " KRROOYWWWWYOOR ",
            "K  R  Y WW Y  R ",
            "  K   R    R    ",
            "                ",
            "                ",
            "                "
        ],
        // Frame 11: Fiery flash filling the entire boundary
        [
            "YYYYYYYYYYYYYYYY",
            "YYRRRROOOORRRRYY",
            "YRRROOYYYYOORRRY",
            "YROOYYYYYYYYOORY",
            "ROOYYWWWWWWYYOOR",
            "OOYYWWWWWWWWYYOO",
            "OYYWWWWWWWWWWYYO",
            "OYYWWWWWWWWWWYYO",
            "OOYYWWWWWWWWYYOO",
            "ROOYYWWWWWWYYOOR",
            "YROOYYYYYYYYOORY",
            "YRRROOYYYYOORRRY",
            "YYRRRROOOORRRRYY",
            "YYYYYYYYYYYYYYYY",
            " YYY YYYY YYYY  ",
            "                "
        ],
        // Frame 12: FULL SCREEN RETRO INFERNO BLAST (Covers entire screen edge-to-edge)
        [
            "WWWWWWWWWWWWWWWW",
            "WWYYYYYYYYYYYYWW",
            "WYYRRRRRRRRRRYYW",
            "WYRROOOOOOOORRYW",
            "WYROOYYYYYYOORWY",
            "WYROYYWWWWYYORWY",
            "WYROYYWWWWYYORWY",
            "WYROOYYYYYYOORWY",
            "WYRROOOOOOOORRYW",
            "WYYRRRRRRRRRRYYW",
            "WWYYYYYYYYYYYYWW",
            "WWWWWWWWWWWWWWWW",
            "WWYYYYWWWWYYYYWW",
            "WYYRRYYYYYYRRYYW",
            "WYRROOOOOOOORRYW",
            "WWWWWWWWWWWWWWWW"
        ]
    ];

    // 16x16 Rolled Scroll
    const scrollRolledPixels = [
        "    ########    ",
        "   #pPPPPPPp#   ",
        "  #pPPPPPPPPp#  ",
        "  #pPP#RR#PPp#  ",
        "  #pPP#RR#PPp#  ",
        "  #pPP#RR#PPp#  ",
        "  #pPP#RR#PPp#  ",
        "  #pPP#RR#PPp#  ",
        "  #pPPPPPPPPp#  ",
        "  #pPPPPPPPPp#  ",
        "   #pPPPPPPp#   ",
        "    ########    ",
        "      #RR#      ",
        "       ##       ",
        "                ",
        "                "
    ];

    // 16x16 Unrolled Parchment
    const parchmentPixels = [
        " ############## ",
        "#pppppppppppppp#",
        "#pPPPPPPPPPPPPp#",
        "#pP##########Pp#",
        "#pP          Pp#",
        "#pP ######## Pp#",
        "#pP ######## Pp#",
        "#pP          Pp#",
        "#pP ######## Pp#",
        "#pP          Pp#",
        "#pP ####  ## Pp#",
        "#pPPPPPPPPPPPPp#",
        "#pppppppppppppp#",
        " ############## ",
        "                "
    ];

    // Item fallbacks generator
    function getItemSvg(id) {
        // Distinct retro icons for all items
        const itemIcons = {
            sandalswallow: {
                pixels: [
                    "  ######  ######  ",
                    " #BBBBBB##BBBBBB# ",
                    "#BWBBBBBWWBWWBBW# ",
                    "#BBWBBBWBBWBBWBB# ",
                    "#BBBWWBWWWWBWWBB# ",
                    "#BBBBWWBBBBWWBBB# ",
                    "#BBBBBWBBBBWBBBB# ",
                    "#BBBBBBWBBWBBBBB# ",
                    "#BBBBBBBBBBBBBBB# ",
                    "#BBBBBBBBBBBBBBB# ",
                    " #BBBBBB##BBBBBB# ",
                    "  ######  ######  "
                ],
                palette: P
            },
            snek: {
                pixels: [
                    "   ##########   ",
                    "  #RRRRRRRRRR#  ",
                    " #RRWWWRRWWWRR# ",
                    "#RRRRRRRRRRRRRR#",
                    "#RRRROOOOOORRRR#",
                    "#RRROOYYYYOORRR#",
                    "#RRROOYYYYOORRR#",
                    "#RRRROOOOOORRRR#",
                    "#RRRRRRRRRRRRRR#",
                    " #RRRRRRRRRRRR# ",
                    "  ############  "
                ],
                palette: P
            },
            es_teh_manis: {
                pixels: [
                    "      #WW#      ",
                    "      #WW#      ",
                    "   ##########   ",
                    "  #MMMMMMMMMM#  ",
                    "  #MLLLLLLLLM#  ",
                    "  #MLLLLLLLLM#  ",
                    "  #MLWLLLLLLM#  ",
                    "  #MLWLLLLLLM#  ",
                    "   #MLLLLLLM#   ",
                    "    #MMMMMM#    ",
                    "     ######     "
                ],
                palette: P
            },
            parfum: {
                pixels: [
                    "      ####      ",
                    "      #GG#      ",
                    "    ########    ",
                    "   #CCCCCCCC#   ",
                    "  #CCCCCCCCCC#  ",
                    "  #CCWWCCCCCCC# ",
                    "  #CCWCCCCCCCC# ",
                    "  #CCCCCCCCCCC# ",
                    "  #CCCCCCCCCCC# ",
                    "   #CCCCCCCCC#  ",
                    "    #########   "
                ],
                palette: P
            },
            dasi: {
                pixels: [
                    "     ######     ",
                    "     #RRRR#     ",
                    "      #RR#      ",
                    "     #RLLR#     ",
                    "    #RRLLRR#    ",
                    "   #RRRLLRRR#   ",
                    "    #RRLLRR#    ",
                    "     #RLLR#     ",
                    "      #RR#      ",
                    "       ##       "
                ],
                palette: P
            },
            kunci: {
                pixels: [
                    "    ######      ",
                    "   #GGGGGG#     ",
                    "  #GG####GG#    ",
                    "  #GG#  #GG#    ",
                    "   #GGGGGG#     ",
                    "    ##GG##      ",
                    "      #G#       ",
                    "      #G##      ",
                    "      #G###     ",
                    "      #G#       ",
                    "      ###       "
                ],
                palette: P
            },
            router: {
                pixels: [
                    " #   #   #   #  ",
                    " #   #   #   #  ",
                    " #   #   #   #  ",
                    "################",
                    "#KKKKKKKKKKKKKK#",
                    "#KKKKKKKKKKKKKK#",
                    "#KKEEKKEEKKEEKK#",
                    "################"
                ],
                palette: P
            },
            TWSkaumhave: {
                pixels: [
                    "   ########     ",
                    "  #WWWWWWWW#    ",
                    " #WWWWWWWWWW#   ",
                    "#WWWWWWWWWWWW#  ",
                    " #WWWWWWWWWW#   ",
                    "  #WWWWWWWW#    ",
                    "   ###WW####    ",
                    "      #W#       ",
                    "      #W#       ",
                    "      ###       "
                ],
                palette: P
            },
            chargerhp: {
                pixels: [
                    "    ##    ##    ",
                    "    ##    ##    ",
                    "   ##########   ",
                    "  #WWWWWWWWWW#  ",
                    "  #WWWWWWWWWW#  ",
                    "  #WWWWWWWWWW#  ",
                    "   ##########   ",
                    "       ##       ",
                    "      #KK#      ",
                    "      #KK#      "
                ],
                palette: P
            },
            micpenaikihsg: {
                pixels: [
                    "     ######     ",
                    "    #kkkkkk#    ",
                    "   #kkWWkkkk#   ",
                    "   #kkkkkkkk#   ",
                    "    #kkkkkk#    ",
                    "     ######     ",
                    "      #KK#      ",
                    "      #KK#      ",
                    "      #KK#      ",
                    "      ####      "
                ],
                palette: P
            },
            kopyah: {
                pixels: [
                    "   ##########   ",
                    "  #KKKKKKKKKK#  ",
                    " #KKKKKKKKKKKK# ",
                    "#KKKKKKKKKKKKKK#",
                    "#KKKKKKKKKKKKKK#",
                    "#KKKKKKKKKKKKKK#",
                    " #KKKKKKKKKKKK# ",
                    "  ############  "
                ],
                palette: P
            },
            hpkuat: {
                pixels: [
                    "   ##########   ",
                    "  #KKKKKKKKKK#  ",
                    "  #K#CCCCCCC#K# ",
                    "  #K#CCCCCCC#K# ",
                    "  #K#########K# ",
                    "  #K#G#G#G#G#K# ",
                    "  #K#G#G#G#G#K# ",
                    "  #K#G#G#G#G#K# ",
                    "  #KKKKKKKKKK#  ",
                    "   ##########   "
                ],
                palette: P
            },
            kamerabunabila: {
                pixels: [
                    "     ####       ",
                    "   ########     ",
                    "  #KKKKKKKK#    ",
                    " #KK######KK#   ",
                    "#KK#CCCCCC#KK#  ",
                    "#KK#CCWWCC#KK#  ",
                    "#KK#CCCCCC#KK#  ",
                    " #KK######KK#   ",
                    "  ##########    "
                ],
                palette: P
            },
            mahkota: {
                pixels: [
                    " #   #   #   #  ",
                    "#G# #G# #G# #G# ",
                    "#GG#GGG#GGG#GG# ",
                    "#GGGGGGGGGGGGG# ",
                    "#GGRGGGRGGGRGG# ",
                    "#GGGGGGGGGGGGG# ",
                    " #############  "
                ],
                palette: P
            },
            buku_ala_ala: {
                pixels: [
                    " ############## ",
                    "#RRRRRRRRRRRRRp#",
                    "#RGGGGGGGGGGGRp#",
                    "#RG   GG   GGRp#",
                    "#RG G GG G GGRp#",
                    "#RG   GG   GGRp#",
                    "#RGGGGGGGGGGGRp#",
                    "#RRRRRRRRRRRRRp#",
                    " ############## "
                ],
                palette: P
            },
            ijazah: {
                pixels: [
                    " ############## ",
                    "#PPPPPPPPPPPPPP#",
                    "#P  ########  P#",
                    "#P ########## P#",
                    "#P ########## P#",
                    "#P  ########  P#",
                    "#P     ##     P#",
                    "#P    #GG#    P#",
                    "#P    #GG#    P#",
                    " ############## "
                ],
                palette: P
            },
            malapangankerja: {
                pixels: [
                    "   ############ ",
                    "  #LLLLLLLLLLLL#",
                    " #LLLLLLLLLLLL# ",
                    "#LLLL#G##G#LLL# ",
                    "#LLL#GG##GG#LL# ",
                    "#LLL#GG##GG#LL# ",
                    "#LLLL#G##G#LLL# ",
                    "#LLLLLLLLLLLLL# ",
                    " #############  "
                ],
                palette: P
            }
        };

        const icon = itemIcons[id];
        if (icon) {
            return createPixelSvg(16, 16, icon.pixels, icon.palette);
        }

        // Generic treasure gem
        return createPixelSvg(16, 16, [
            "     ####       ",
            "   ##YYYY##     ",
            "  #YYWWYYYY#    ",
            " #YYYYYYYYYY#   ",
            "  #YYYYYYYY#    ",
            "   ##YYYY##     ",
            "     ####       "
        ], P);
    }

    // Built-in registry of fallback pixel SVGs
    window.BUILTIN_PIXEL_FALLBACKS = {
        chest_closed: createPixelSvg(16, 16, chestClosedPixels, P),
        chest_locked_glow: createPixelSvg(16, 16, chestGlowFramesPixels[2], P),
        chest_open: createPixelSvg(16, 16, chestOpenFramesPixels[5], P),
        scroll_rolled: createPixelSvg(16, 16, scrollRolledPixels, P),
        parchment_unrolled: createPixelSvg(16, 16, parchmentPixels, P),

        // 6-Frame Seamless Chest Glow Loop
        chest_glow_1: createPixelSvg(16, 16, chestGlowFramesPixels[0], P),
        chest_glow_2: createPixelSvg(16, 16, chestGlowFramesPixels[1], P),
        chest_glow_3: createPixelSvg(16, 16, chestGlowFramesPixels[2], P),
        chest_glow_4: createPixelSvg(16, 16, chestGlowFramesPixels[3], P),
        chest_glow_5: createPixelSvg(16, 16, chestGlowFramesPixels[4], P),
        chest_glow_6: createPixelSvg(16, 16, chestGlowFramesPixels[5], P),

        // 6-Frame Chest Opening Sequence
        chest_open_1: createPixelSvg(16, 16, chestOpenFramesPixels[0], P),
        chest_open_2: createPixelSvg(16, 16, chestOpenFramesPixels[1], P),
        chest_open_3: createPixelSvg(16, 16, chestOpenFramesPixels[2], P),
        chest_open_4: createPixelSvg(16, 16, chestOpenFramesPixels[3], P),
        chest_open_5: createPixelSvg(16, 16, chestOpenFramesPixels[4], P),
        chest_open_6: createPixelSvg(16, 16, chestOpenFramesPixels[5], P),

        // 12-Frame Bomb Explosion Sequence
        bomb_1: createPixelSvg(16, 16, bombFramesPixels[0], P),
        bomb_2: createPixelSvg(16, 16, bombFramesPixels[1], P),
        bomb_3: createPixelSvg(16, 16, bombFramesPixels[2], P),
        bomb_4: createPixelSvg(16, 16, bombFramesPixels[3], P),
        bomb_5: createPixelSvg(16, 16, bombFramesPixels[4], P),
        bomb_6: createPixelSvg(16, 16, bombFramesPixels[5], P),
        bomb_7: createPixelSvg(16, 16, bombFramesPixels[6], P),
        bomb_8: createPixelSvg(16, 16, bombFramesPixels[7], P),
        bomb_9: createPixelSvg(16, 16, bombFramesPixels[8], P),
        bomb_10: createPixelSvg(16, 16, bombFramesPixels[9], P),
        bomb_11: createPixelSvg(16, 16, bombFramesPixels[10], P),
        bomb_12: createPixelSvg(16, 16, bombFramesPixels[11], P),

        getItemFallback: getItemSvg
    };

    /**
     * Extracts canonical short key from asset path or key (e.g. "assets/bomb_12.png" -> "bomb_12")
     */
    function extractShortKey(key) {
        if (!key) return '';
        if (typeof key !== 'string') return '';
        const clean = key.split('/').pop().split('.')[0];
        return clean;
    }

    /**
     * Resolves the configured asset URL, with safe fallback binding.
     */
    window.resolveAssetUrl = function (key) {
        if (!key) return '';
        // If key is already a path like "assets/..." or starts with "http" or "data:"
        if (key.startsWith('assets/') || key.startsWith('./assets/') || key.startsWith('/') || key.startsWith('http') || key.startsWith('data:')) {
            return key;
        }
        // Check if item has custom image in lootItemsById (loaded from loot_table.json)
        if (window.lootItemsById && window.lootItemsById[key]) {
            const item = window.lootItemsById[key];
            if (item.image) return item.image;
            if (item.icon) return item.icon;
            if (item.asset) return item.asset;
        }
        // Check if key is in top-level config
        if (window.ASSET_CONFIG && window.ASSET_CONFIG[key]) {
            return window.ASSET_CONFIG[key];
        }
        // Check if key is in items
        if (window.ASSET_CONFIG && window.ASSET_CONFIG.items && window.ASSET_CONFIG.items[key]) {
            return window.ASSET_CONFIG.items[key];
        }
        // If it's an item in lootItemsById without explicit image, default to assets/items/{key}.png
        if (window.lootItemsById && window.lootItemsById[key]) {
            return `assets/items/${key}.png`;
        }
        // Check default assets path
        return `assets/${key}.png`;
    };

    /**
     * Retrieves the procedural pixel art fallback for any key or path.
     */
    function getFallbackSvg(key) {
        if (!key) return '';
        const shortKey = extractShortKey(key);

        if (window.BUILTIN_PIXEL_FALLBACKS[key]) {
            return window.BUILTIN_PIXEL_FALLBACKS[key];
        }
        if (window.BUILTIN_PIXEL_FALLBACKS[shortKey]) {
            return window.BUILTIN_PIXEL_FALLBACKS[shortKey];
        }

        // If it's a bomb frame beyond 12 (e.g. bomb_13 to bomb_20+), fall back to blast frame 12
        if (shortKey.startsWith('bomb_')) {
            return window.BUILTIN_PIXEL_FALLBACKS.bomb_12 || window.BUILTIN_PIXEL_FALLBACKS.bomb_4;
        }
        // If it's a chest glow frame beyond 6
        if (shortKey.startsWith('chest_glow_')) {
            return window.BUILTIN_PIXEL_FALLBACKS.chest_glow_3;
        }
        // If it's a chest open frame beyond 6
        if (shortKey.startsWith('chest_open_')) {
            return window.BUILTIN_PIXEL_FALLBACKS.chest_open_6;
        }

        if (window.BUILTIN_PIXEL_FALLBACKS.getItemFallback) {
            return window.BUILTIN_PIXEL_FALLBACKS.getItemFallback(shortKey);
        }
        return '';
    }

    /**
     * Binds an image element to automatically use the configured asset path,
     * and seamlessly swap to the built-in pixel SVG if the file is missing.
     */
    window.bindPixelImage = function (imgEl, key) {
        if (!imgEl) return;
        const targetSrc = window.resolveAssetUrl(key);
        const fallbackSrc = getFallbackSvg(key);

        imgEl.onerror = function () {
            // If custom asset file in assets/items/ isn't found, try assets/{key}.png before procedural fallback
            if (!imgEl.dataset.triedAlt && targetSrc.includes('assets/items/')) {
                imgEl.dataset.triedAlt = 'true';
                imgEl.src = targetSrc.replace('assets/items/', 'assets/');
                return;
            }
            if (imgEl.src !== fallbackSrc && fallbackSrc) {
                imgEl.src = fallbackSrc;
                imgEl.dataset.isFallback = 'true';
            }
        };

        imgEl.dataset.triedAlt = 'false';
        imgEl.dataset.isFallback = 'false';
        imgEl.src = targetSrc;
    };

    /**
     * Starts a continuous, seamless looping frame animation on an <img> element.
     * Returns a handle with a .stop() method.
     */
    window.startLoopAnimation = function (imgEl, frames, frameMs) {
    if (!imgEl || !frames || frames.length === 0) return { stop: () => {} };

    // Same fix as playFrameAnimation: resolve each frame's real-vs-fallback
    // src up front instead of letting bindPixelImage's async onerror race
    // against the next tick.
    const resolved = new Array(frames.length);
    let ready = false;
    Promise.all(frames.map((key, i) => new Promise(done => {
        const url = window.resolveAssetUrl(key);
        if (!url) {
            resolved[i] = getFallbackSvg(key);
            return done();
        }
        const pre = new Image();
        pre.onload = () => { resolved[i] = url; done(); };
        pre.onerror = () => { resolved[i] = getFallbackSvg(key); done(); };
        pre.src = url;
    }))).then(() => { ready = true; });

    let currentIdx = 0;
    let timer = null;
    let isStopped = false;

    function tick() {
        if (isStopped) return;
        if (!ready) {
            // Frames still resolving -- try again shortly rather than
            // falling back into the old racy path.
            timer = setTimeout(tick, 20);
            return;
        }
        imgEl.src = resolved[currentIdx];
        currentIdx = (currentIdx + 1) % frames.length;
        timer = setTimeout(tick, frameMs || 150);
    }

    tick();

    return {
        stop: function () {
            isStopped = true;
            if (timer) clearTimeout(timer);
        }
    };
};

    /**
     * Plays a sequence of animation frames once, resolving when complete.
     * onFrame(frameIndex, totalFrames, isLastFrame, frameKey) is called for each frame.
     */
    window.playFrameAnimation = function (imgEl, frames, frameMs, onFrame) {
    return new Promise(resolve => {
        if (!imgEl || !frames || frames.length === 0) return resolve();

        // Preload every frame AND decide its FINAL displayable src (real asset
        // or procedural fallback) right here, up front.
        //
        // Previously this only preloaded the real asset and left the
        // real-vs-fallback decision to bindPixelImage()'s onerror handler,
        // fired live during playback. That handler is asynchronous (it waits
        // for the browser's network request to actually fail), so at fast
        // frameMs (e.g. the bomb's 80ms) the "use fallback" callback for
        // frame N routinely didn't resolve until frame N+1 or N+2 had already
        // started loading -- and when it finally fired, it stomped whatever
        // the animation had since moved on to. That's what caused frames to
        // visibly vanish/glitch. Resolving everything before playback starts
        // removes that race entirely: by the time next() runs, every index
        // already has a ready-to-use src.
        const resolved = new Array(frames.length);
        const preloads = frames.map((key, i) => new Promise(done => {
            const url = window.resolveAssetUrl(key);
            if (!url) {
                resolved[i] = getFallbackSvg(key);
                return done();
            }
            const pre = new Image();
            pre.onload = () => { resolved[i] = url; done(); };
            pre.onerror = () => { resolved[i] = getFallbackSvg(key); done(); };
            pre.src = url;
        }));

        Promise.all(preloads).then(() => {
            let idx = 0;

            function next() {
                if (idx >= frames.length) {
                    return resolve();
                }
                const currentKey = frames[idx];
                const isLast = (idx === frames.length - 1);

                // Direct assignment -- no re-triggered onerror lookup here,
                // so there's nothing left to race against.
                imgEl.src = resolved[idx];
                imgEl.dataset.isFallback = (resolved[idx] === getFallbackSvg(currentKey)) ? 'true' : 'false';

                if (typeof onFrame === 'function') {
                    onFrame(idx, frames.length, isLast, currentKey);
                }

                idx++;
                if (idx < frames.length) {
                    setTimeout(next, frameMs || 90);
                } else {
                    resolve();
                }
            }

            next();
        });
    });
};
})();

// =============================================================================
// RETRO 8-BIT SYNTHESIZER (ZERO ASSET OVERHEAD, PURE WEB AUDIO API)
// =============================================================================
window.RetroAudio = (function () {
    let ctx = null;
    const customAudioCache = {}; // path -> Audio instance, so a repeat play (retries, next student) doesn't re-fetch the file

    function getAudioContext() {
        if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            ctx = new AudioCtx();
        }
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        return ctx;
    }

    function isMuted() {
        return localStorage.getItem('retro_mute') === 'true';
    }

    function playTone(freq, type, duration, delay = 0, gainLevel = 0.1) {
        if (isMuted()) return;
        try {
            const c = getAudioContext();
            if (!c) return;

            const now = c.currentTime + delay;
            const osc = c.createOscillator();
            const gain = c.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(gainLevel, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(c.destination);

            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {
            // Audio policy / silent ignore
        }
    }

    return {
        isMuted,
        toggleMute: function () {
            const next = !isMuted();
            localStorage.setItem('retro_mute', next ? 'true' : 'false');
            return next;
        },

        // Classic retro button click
        playClick: function () {
            playTone(440, 'triangle', 0.05, 0, 0.08);
            playTone(880, 'triangle', 0.04, 0.03, 0.06);
        },

        // Mystery chest suspense rumble / chime
        playSuspense: function () {
            playTone(220, 'sine', 0.3, 0, 0.08);
            playTone(277.18, 'sine', 0.3, 0.15, 0.08);
            playTone(329.63, 'sine', 0.4, 0.3, 0.1);
        },

        // Chest opening fanfare
        playChestOpen: function () {
            playTone(261.63, 'square', 0.1, 0, 0.08);    // C4
            playTone(329.63, 'square', 0.1, 0.08, 0.08); // E4
            playTone(392.00, 'square', 0.1, 0.16, 0.08); // G4
            playTone(523.25, 'square', 0.25, 0.24, 0.12); // C5
        },

        // Victory / Correct answer jingle
        playCorrect: function () {
            playTone(523.25, 'triangle', 0.12, 0, 0.1);
            playTone(659.25, 'triangle', 0.12, 0.08, 0.1);
            playTone(783.99, 'triangle', 0.2, 0.16, 0.12);
            playTone(1046.50, 'triangle', 0.35, 0.25, 0.15);
        },

        // Wrong answer buzz
        playWrong: function () {
            playTone(150, 'sawtooth', 0.18, 0, 0.15);
            playTone(110, 'sawtooth', 0.25, 0.12, 0.15);
        },

        // Bomb blast explosion rumble
        playBomb: function () {
            if (isMuted()) return;
            try {
                const c = getAudioContext();
                if (!c) return;
                const now = c.currentTime;

                // White noise buffer for explosion
                const bufferSize = c.sampleRate * 0.5;
                const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }

                const noise = c.createBufferSource();
                noise.buffer = buffer;

                const filter = c.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, now);
                filter.frequency.exponentialRampToValueAtTime(50, now + 0.5);

                const gain = c.createGain();
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(c.destination);

                noise.start(now);
                noise.stop(now + 0.5);
            } catch (e) {}
        },

        // Lightweight fuse sizzle (procedural — used automatically as long as
        // bomb_fuse_sound in assets-config.js is left null)
        playFuse: function () {
            if (isMuted()) return;
            try {
                const c = getAudioContext();
                if (!c) return;
                const now = c.currentTime;
                const bufferSize = c.sampleRate * 0.35;
                const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
                const noise = c.createBufferSource();
                noise.buffer = buffer;
                const filter = c.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(2500, now);
                const gain = c.createGain();
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(c.destination);
                noise.start(now);
                noise.stop(now + 0.35);
            } catch (e) {}
        },

        // Play a custom sound file (bomb_fuse_sound / bomb_explosion_sound in
        // assets-config.js, or any other path you want). Cached per path after
        // first play — stays lightweight, nothing is fetched until it's
        // actually needed. Returns false if no path was given, muted, or the
        // browser refused to play it, so the caller can fall back to a
        // procedural sound (see how playBombSequence in student.js uses this).
        playFile: function (path) {
            if (!path || isMuted()) return false;
            try {
                let audio = customAudioCache[path];
                if (!audio) {
                    audio = new Audio(path);
                    audio.preload = 'auto';
                    customAudioCache[path] = audio;
                }
                audio.currentTime = 0;
                audio.play().catch(() => {});
                return true;
            } catch (e) {
                return false;
            }
        },

        // Loot drop chime
        playLoot: function () {
            playTone(440, 'sine', 0.08, 0, 0.1);
            playTone(554.37, 'sine', 0.08, 0.06, 0.1);
            playTone(659.25, 'sine', 0.1, 0.12, 0.1);
            playTone(880, 'sine', 0.3, 0.18, 0.15);
        },

        // Tension timer tick
        playTick: function () {
            playTone(900, 'triangle', 0.03, 0, 0.04);
        }
    };
})();