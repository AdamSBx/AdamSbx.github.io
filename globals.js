
/** offset from the root notes (mRootNotesWithoutOct = [7,0,4,9]) */
const mChords = [
    // MAJOR CHORDS
    [0,0,0,3], // C
    [0,2,3,2], // G
    [2,2,2,0], // D
    [2,1,0,0], // A
    [4,4,4,2], // E
    [4,3,2,2], // B
    [3,1,2,1], // F#
    [1,1,1,4], // Db
    [1,3,4,3], // Ab
    [3,3,3,1], // Eb
    [3,2,1,1], // Bb
    [2,0,1,0], // F
    // MINOR CHORDS
    [2,0,0,0], // Am
    [0,4,3,2], // Em
    [4,2,2,2], // Bm
    [2,1,2,4], // F#m
    [1,1,0,4], // C#m
    [1,3,4,2], // G#m
    [3,3,2,1], // Ebm
    [3,1,1,1], // Bbm
    [1,0,1,3], // Fm
    [0,3,3,3], // Cm
    [0,2,3,1], // Gm
    [2,2,1,0]  // Dm
];

/** G, C, E, A */
const mRootNotesWithoutOct = [7,0,4,9];

/** G,C,E,A,G,C,E,A twice for "down" and "up" audio samples (8 audio samples) */
const mRootNotes = [67, 60, 64, 69, 67, 60, 64, 69];

/** 0 to 23 */
let mLastPressedBtnIdx = 0;