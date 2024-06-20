// NEEDS ACCESS TO "globals.js"

const canvas = document.createElement("canvas");
canvas.style.backgroundColor = "#242424";
document.body.appendChild(canvas);

//=============================================== add mouse event listeners
// event.button describes the mouse button that was clicked 0 is left, 1 is middle, 2 is right
canvas.addEventListener('mousedown',  function(event) {
    mMouseDown = true;
    input(event);
});
canvas.addEventListener('mousemove', function(event) {
    if (mLastClickId == -1 && mMouseDown) { input(event); } // xxx check if click was on strings to avoid chord buttn press via drag xxx
});
canvas.addEventListener('mouseup',  function(event) {
    mMouseDown = false;
    mLastTouchedString = -1;
});

//=============================================== add touch event listeners
canvas.addEventListener('touchstart', function(event) {
    event.preventDefault(); // prevent the default touch behavior to avoid triggering `click` or other unintended events
    mMouseDown = true;
    input(event);
});
canvas.addEventListener('touchmove',  function(event) {
    if (mLastClickId == -1) { input(event); } // xxx check if click was on strings to avoid chord buttn press via drag xxx
});
canvas.addEventListener('touchend',  function(event) {
    mMouseDown = false;
    mLastTouchedString = -1;
});

//===============================================
onload = function () {
    setRect(0, 200, 400, 700);
};

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

/** local positions of the circle, updated in setRect() */
let cofL = 0, cofT = 0, cofR = 0, cofB = 0, cofMidX = 0, cofMidY = 0;

let mInnerRadius = 30, mMidRadius = 60, mOuterRadius = 90; // updated in setRect()
let outerArcWidth = 1, innerArcWidth = 1; // updated in setRect()
const PIbySix = Math.PI / 6;
const outerText = ["C","G","D","A","E","B","F#","Db","Ab","Eb","Bb","F"];
const innerText = ["a","e","b","f#","c#","g#","d#","bb","f","c","g","d"];

/** used to determine whether a "mousemove" event is a drag or not */
let mMouseDown = false;

/** -1 = outside of circle, -2 = middle, 0 to 23 = chord buttons */
let mLastClickId = 0;

/** number of frets visible in the chord charts */
const mFretsNum = 4;

/** name of the font used for drawing the chord and note names */
let fontName = "Arial";

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function input(event) {
    //let xGlobalPos = event.clientX, yGlobalPos = event.clientY;
    let xLocalToClickedElement = event.offsetX, yLocalToClickedElement = event.offsetY;

    // -2 if pos was in the middle and -1 if on the outside
    mLastClickId = get_chord_btn_at_position(xLocalToClickedElement, yLocalToClickedElement);

    if (mLastClickId > -1 && mLastClickId < 24) {
        mLastPressedBtnIdx = mLastClickId;
        drawCircleOfFifths();
        startSequencePlayback(); // function from file webAudioProcessor.html update filename if changed xxxx
    }

    // strings panel
    if (mLastClickId == -1) {
        stringsRectInput(xLocalToClickedElement, yLocalToClickedElement);
    }

    alert(mLastClickId);
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function stringsRectInput(x, y) {
    let stringNr = -1;
    let h = (stringsB - stringsT) / 3;

    for (let s = 0; s < 4; s++) {
        if (Math.abs(y - (stringsT + h * s)) < mTriggerSizeHorizontalMode) {
            stringNr = s;
            break;
        }
    }
    if (stringNr != mLastTouchedString) {
        mLastTouchedString = stringNr;

        if (stringNr > -1) {
            loadAndPlayAudio(stringNr)
        }
    }
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function drawCircleOfFifths() { // uses local coordinates
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, stringsT); // not sure if this is very useful here xxx

    //=========================================== fill the circles
    ctx.beginPath();
    ctx.arc(cofMidX, cofMidY, mOuterRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'DarkGrey';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cofMidX, cofMidY, mMidRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'Grey';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cofMidX, cofMidY, mInnerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = canvas.style.backgroundColor;
    ctx.fill();

    //=========================================== draw the pressed chord button
    // mArcPaint.setColor(pressedCol);
    // mArcPaint.setAlpha(125);
    ctx.beginPath();

    // calculate start and end angles
    const startAngle = -PIbySix * 3.5 + PIbySix * mLastPressedBtnIdx;
    const endAngle = startAngle + PIbySix;

    if (mLastPressedBtnIdx < 12) {
        ctx.lineWidth = outerArcWidth;
        ctx.arc(cofMidX, cofMidY, mMidRadius + outerArcWidth * 0.5, startAngle, endAngle);
    }
    else {
        ctx.lineWidth = innerArcWidth;
        ctx.arc(cofMidX, cofMidY, mInnerRadius + innerArcWidth * 0.5, startAngle, endAngle);
    }
    ctx.strokeStyle = 'white';
    ctx.stroke();

    //=========================================== draw all the lines (except for the chord charts)
    ctx.beginPath();

    ctx.arc(cofMidX, cofMidY, mInnerRadius, 0, 2 * Math.PI);
    ctx.moveTo(cofMidX + mMidRadius, cofMidY);
    ctx.arc(cofMidX, cofMidY, mMidRadius, 0, 2 * Math.PI);
    ctx.moveTo(cofMidX + mOuterRadius, cofMidY);
    ctx.arc(cofMidX, cofMidY, mOuterRadius, 0, 2 * Math.PI);

    for (let i = 0; i < 12; i++) {
        // calculate the outer and the inner points of the lines (-3.5 to rotate by 105 degrees)
        let innerX = cofMidX + mInnerRadius * Math.cos(PIbySix * (i - 3.5)); // inner_x
        let innerY = cofMidY + mInnerRadius * Math.sin(PIbySix * (i - 3.5)); // inner_y
        let outerX = cofMidX + mOuterRadius * Math.cos(PIbySix * (i - 3.5)); // outer_x
        let outerY = cofMidY + mOuterRadius * Math.sin(PIbySix * (i - 3.5)); // outer_y
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    ctx.stroke();

    //=========================================== draw text
    ctx.fillStyle = 'black';

    // Set text alignment to center xxx do this somewhere else xxx
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let x, y;

    // draw outer text
    ctx.font = outerArcWidth * 0.5 + 'px ' + fontName; // set in setRect() ? xxx
    for (let i = 0; i < 12; i++) {
        x = cofMidX + (mOuterRadius - outerArcWidth * 0.5) * Math.cos(PIbySix * (i - 3));
        y = cofMidY + (mOuterRadius - outerArcWidth * 0.5) * Math.sin(PIbySix * (i - 3));
        ctx.fillText(outerText[i], x, y);
    }

    // inner text
    ctx.font = innerArcWidth * 0.42 + 'px ' + fontName; // set in setRect() ? xxx
    for (let i = 0; i < 12; i++) {
        x = cofMidX + (mInnerRadius + innerArcWidth * 0.5) * Math.cos(PIbySix * (i - 3));
        y = cofMidY + (mInnerRadius + innerArcWidth * 0.5) * Math.sin(PIbySix * (i - 3));
        ctx.fillText(innerText[i], x, y);
    }

    //=========================================== draw the middle chord chart
    if (true) {
        ctx.fillStyle = 'red'; // for the dots
        ctx.strokeStyle = 'gray'; // for the lines

        let mChartLineW = 2;
        let w = Math.round(mInnerRadius * 0.82);
        let h = Math.round(w * 1.35);
        let rL = Math.round(cofMidX - w * 0.5);
        let rT = Math.round(cofMidY - h * 0.5);
        let fretW = Math.round(w / 3); // xxx calculate in set_rect
        let fretH = Math.round(h / mFretsNum); // xxx calculate in set_rect
        let L = rL - mChartLineW / 2;
        let T = rT - mChartLineW / 2;
        let R = L + fretW * 3 + mChartLineW;
        let B = T + fretH * mFretsNum + mChartLineW;

        // draw the nut (first horizontal line) thicker, if not shifted (which is only the case for guitar chord charts)
        //mChartLinePaint.setStrokeWidth(mChartLineW * 2);
        ctx.beginPath();
        ctx.moveTo(L, rT);
        ctx.lineTo( R, rT);
        ctx.stroke();

        //mChartLinePaint.setStrokeWidth(mChartLineW);
        ctx.beginPath();
        for (let j = 1; j < mFretsNum+1; j++) { // horizontal lines
            ctx.moveTo(L, rT + fretH * j);
            ctx.lineTo( R, rT + fretH * j);
        }
        for (let j = 0; j < 4; j++) { // vertical lines
            ctx.moveTo(rL + fretW * j, T,);
            ctx.lineTo(rL + fretW * j, B);
        }
        ctx.stroke();

        // draw the dots
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            if (mChords[mLastPressedBtnIdx][i] == 0) { continue; }
            x = rL + fretW * i;
            y = rT + fretH * (mChords[mLastPressedBtnIdx][i] - 0.5);
            ctx.moveTo(x, y); // avoids a line between prev path end and start of next
            ctx.arc(x, y, fretH * 0.3, 0, 2 * Math.PI);
        }
        ctx.fill();
    }
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

const noteNames = [
    "C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4",
    "C5","C#5","D5","D#5","E5","F5","F#5","G5","G#5","A5","A#5","B5"
];

/** local positions, updated is "set_rect()" */
let stringsL = 0, stringsR = 0, stringsT = 0, stringsB = 0;     // used for horizontal mode
let stringsL2 = 0, stringsR2 = 0, stringsT2 = 0, stringsB2 = 0; // used for vertical mode

/** time in milliseconds (Date.now()) when the string was last played for each string*/
let mVibrationStartTimes = [0, 0, 0, 0];

/** vibration duration of the strings in milliseconds */
let mVibrationDurationMs = 1700;

/** vibration distance of the strings in pixel, updated in setRect() */
let mVibrationDistanceVerticalMode = 20, mVibrationDistanceHorizontalMode = 20;

/** trigger size of a single string in pixel, updated in setStringSpacing() */
let mTriggerSizeVerticalMode = 1, mTriggerSizeHorizontalMode = 1;

/** size of the note names next to the strings in pixel set in setStringSpacing() */
let mVerticalModeTextSize = 0, mHorizontalModeTextSize = 0;

/** normalized float use setStringSpacing() to set this or call setRect() after changing (which calls setStringSpacing()) */
let mStringSpacing = 0.5;

/** used to avoid triggering the same string multiple times on drag input, reset on mouse up (set to -1) */
let mLastTouchedString = -1;

/** xxx */
let mVerticalMode = false;

/** 17 is the amount of cycles per second
 * if the cycles per second are for example 30 or 60 on 60Hz screen, the vibration will be not visible (or almost)
 * also the animation will look slow or weird if too close to the screen's refresh rate (or half of it)
 * 17 was tested on devices with 60Hz and 120Hz */
const vibrationSpeed = (mVibrationDurationMs / 1000) * 17;

function drawStrings() {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, cofB, canvas.width, canvas.height);

    let y, mid, vibraProg, add;
    let  redraw = false;
    const time = Date.now();
    const h = (stringsB - stringsT) / 3;

    //=========================================== draw the note names
    ctx.fillStyle = "gray";

    if (mVerticalMode) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = mVerticalModeTextSize + 'px ' + fontName;
    }
    else {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = mHorizontalModeTextSize + 'px ' + fontName;
    }

    for (let i = 0; i < 4; i++) {
        let idx = mRootNotesWithoutOct[i] + mChords[mLastPressedBtnIdx][i];
        y = stringsT + h * i;
        ctx.fillText(noteNames[idx], stringsL, y);
    }

    //=========================================== draw the strings
    ctx.beginPath();

    for (let i = 0; i < 4; i++) {
        vibraProg = 1 - (time - mVibrationStartTimes[i]) / mVibrationDurationMs; // inverted normalized vibration progress
        vibraProg = Math.max(vibraProg, 0);
        if (vibraProg > 0) { redraw = true; }

        add = mVibrationDistanceHorizontalMode * (Math.sin(2 * Math.PI * vibrationSpeed * vibraProg) * (vibraProg * vibraProg));
        y = stringsT + h * i;
        mid = (stringsL + stringsR) * 0.5;
        ctx.moveTo(stringsL, y);
        ctx.quadraticCurveTo(mid, y + add, stringsR, y);
    }
    ctx.strokeStyle = "gray";
    ctx.stroke();

    if (redraw) { requestAnimationFrame(drawStrings); }
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
/** visual only no audio is played via this function */
function startStringVibration(stringNr_int, redraw_bool) {
    mVibrationStartTimes[stringNr_int] = Date.now();
    if (redraw_bool) { requestAnimationFrame(drawStrings); }
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function setRect(L, T, R, B) {
    canvas.style.position = 'absolute';
    let w = R - L, h = B - T;
    canvas.style.left = L + "px";
    canvas.style.top = T + "px";

    // sets the actual size of the element (does not change the resolution of the canvas)
    canvas.style.width = w + "px"; 
    canvas.style.height = h + "px";

    // sets the resolution of the canvas (not the size of the element)
    canvas.width = w;
    canvas.height = h;

    const circleSize = Math.min(canvas.width, canvas.height * 0.7);
    
    cofMidX = canvas.width / 2;
    cofMidY = circleSize / 2;

    cofL = cofMidX - circleSize * 0.5;
    cofT = cofMidY - circleSize * 0.5;
    cofR = cofMidX + circleSize * 0.5;
    cofB = cofMidY + circleSize * 0.5;

    mInnerRadius = circleSize * 0.15;
    mMidRadius   = circleSize * 0.3;
    mOuterRadius = circleSize * 0.45;
    innerArcWidth = mMidRadius - mInnerRadius;
    outerArcWidth = mOuterRadius - mMidRadius;

    setStringSpacing(mStringSpacing);

    drawCircleOfFifths();
    drawStrings();
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function setStringSpacing(normalizedValue) {
    mStringSpacing = Math.max(Math.min(normalizedValue, 1), 0);
    let horizontalModeSpacing = 0.15 + mStringSpacing * 0.65;
    let verticalModeSpacing = 0.15 + mStringSpacing * 0.5;
    let distanceFromCircleToEdge = (cofT + cofB) * 0.5 - mOuterRadius;
    let y = cofB - distanceFromCircleToEdge;
    let availableHeight = canvas.height - y;
    const yMiddle = y + availableHeight * 0.5;
    const h = availableHeight * horizontalModeSpacing;

    // used for horizontal mode
    stringsL = canvas.width * 0.1;
    stringsR = canvas.width * 0.9;
    stringsT = yMiddle - h * 0.5;
    stringsB = yMiddle + h * 0.5;

    // used for vertical mode
    const w = canvas.width * verticalModeSpacing;
    stringsL2 = cofMidX - w * 0.5;
    stringsR2 = cofMidX + w * 0.5;
    stringsT2 = yMiddle - availableHeight * 0.35;
    stringsB2 = yMiddle + availableHeight * 0.35;

    //================================================================ update the values for horizontal mode
    let spacePerString = (stringsB - stringsT) / 3;
    mVibrationDistanceHorizontalMode = Math.max(Math.min((stringsR - stringsL) * 0.03, spacePerString * 0.25), 1);
    mTriggerSizeHorizontalMode = 0.5 * spacePerString;

    // set text the size fo horizontal mode, reduce the factor as mStringSpacing increases to avoid oversized text
    mHorizontalModeTextSize = (0.5 - mStringSpacing * 0.2) * spacePerString;

    //================================================================ update the values for vertical mode
    let spacing = Math.pow(1 - mStringSpacing, 3);
    spacePerString = (stringsR2 - stringsL2) / 3;
    mVibrationDistanceVerticalMode = Math.max(Math.min((stringsB2 - stringsT2) * 0.03, spacePerString * 0.25), 1);
    mTriggerSizeVerticalMode = 0.5 * spacePerString;

    // set text the size for vertical mode, reduce the factor as mStringSpacing increases to avoid oversized text
    mVerticalModeTextSize = (0.5 - mStringSpacing * 0.2) * spacePerString;

    //================================================================
    // updates text size of mTextPaint and calls "postInvalidate()"
    //setStringsOrientation(mVerticalMode);
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function distance_between_two_points(x1, y1, x2, y2) { return Math.sqrt((x1-x2) * (x1-x2) + (y1-y2) * (y1-y2)); }

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
/**  x and y must be local to the canvas element, returns -2 if pos was in the middle and -1 if on the outside */
function get_chord_btn_at_position(x, y) {
    let btn = 0;
    let position_radius = distance_between_two_points(cofMidX, cofMidY, x, y);

    if (position_radius > mOuterRadius) { return -1; } // pos is outside of all circles
    if (position_radius < mInnerRadius) { return -2; } // pos is in middle circle

    let angle = Math.atan2(cofMidY - y, cofMidX - x); // convert to degrees: angle * 180 / PI
    if (angle < 0) { angle += Math.PI * 2; }

    btn = (angle / (Math.PI * 2) * 12);
    btn -= 2.5; // subtract 2.5 because index 0 is on the left but we need it on top
    btn = Math.floor(btn);

    if (btn < 0) { btn += 12; }
    if (position_radius < mMidRadius) { btn += 12; }
    return btn;
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%