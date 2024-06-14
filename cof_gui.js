
const canvas = document.createElement("canvas");
canvas.style.backgroundColor = "black";
canvas.onclick = input;
document.body.appendChild(canvas);

onload = function () {
    setRect(0, 200, 400, 600);
};

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

var midX = 0, midY = 0; // local middle positions of the circle
var mInnerRadius = 30, mMidRadius = 60, mOuterRadius = 90; // updated in setRect()
var outerArcWidth = 1, innerArcWidth = 1; // updated in setRect()
const PIbySix = 3.1415 / 6;
const outerText = ["C","G","D","A","E","B","F#","Db","Ab","Eb","Bb","F"];
const innerText = ["a","e","b","f#","c#","g#","d#","bb","f","c","g","d"];
var mLastPressedBtnIdx = 0;

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function input(event) {
    var xGlobalPos = event.clientX, yGlobalPos = event.clientY;
    var xLocalToClickedElement = event.offsetX, yLocalToClickedElement = event.offsetY;

    mLastPressedBtnIdx = get_chord_btn_at_position(xLocalToClickedElement, yLocalToClickedElement);
    draw();
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function draw() { // uses local coordinates
    const ctx = canvas.getContext("2d");

    //=========================================== fill the circles
    ctx.beginPath();
    ctx.arc(midX, midY, mOuterRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'gray';
    ctx.fill();

    ctx.moveTo(midX + mInnerRadius, midY); // avoids a line between prev path end and start of next
    ctx.arc(midX, midY, mInnerRadius, 0, 2 * Math.PI);

    ctx.moveTo(midX + mMidRadius, midY); // avoids a line between prev path end and start of next
    ctx.arc(midX, midY, mMidRadius, 0, 2 * Math.PI);

    //=========================================== draw all the lines
    for (let i = 0; i < 12; i++) {
        // calculate the outer and the inner points of the lines (-3.5 to rotate by 105 degrees)
        let innerX = midX + mInnerRadius * Math.cos(PIbySix * (i - 3.5)); // inner_x
        let innerY = midY + mInnerRadius * Math.sin(PIbySix * (i - 3.5)); // inner_y
        let outerX = midX + mOuterRadius * Math.cos(PIbySix * (i - 3.5)); // outer_x
        let outerY = midY + mOuterRadius * Math.sin(PIbySix * (i - 3.5)); // outer_y

        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
    }

    // lines
    ctx.strokeStyle = 'black';
    ctx.stroke();

    //=========================================== draw text
    ctx.fillStyle = 'black';

    // Set text alignment to center xxx do this somewhere else
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let x, y;

    // draw outer text
    ctx.font = outerArcWidth * 0.5 + 'px Arial'; // set in setRect() ? xxx
    for (let i = 0; i < 12; i++) {
        x = midX + (mOuterRadius - outerArcWidth * 0.5) * Math.cos(PIbySix * (i - 3));
        y = midY + (mOuterRadius - outerArcWidth * 0.5) * Math.sin(PIbySix * (i - 3));
        ctx.fillText(outerText[i], x, y);
    }

    // inner text
    ctx.font = innerArcWidth * 0.42 + 'px Arial'; // set in setRect() ? xxx
    for (let i = 0; i < 12; i++) {
        x = midX + (mInnerRadius + innerArcWidth * 0.5) * Math.cos(PIbySix * (i - 3));
        y = midY + (mInnerRadius + innerArcWidth * 0.5) * Math.sin(PIbySix * (i - 3));
        ctx.fillText(innerText[i], x, y);
    }

    ctx.fillText(mLastPressedBtnIdx, midX, midY);
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

    midX = canvas.width / 2;
    midY = canvas.height / 2;
    mInnerRadius = canvas.width * 0.15;
    mMidRadius   = canvas.width * 0.3;
    mOuterRadius = canvas.width * 0.45;
    innerArcWidth = mMidRadius - mInnerRadius;
    outerArcWidth = mOuterRadius - mMidRadius;

    draw();
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function distance_between_two_points(x1, y1, x2, y2) { return Math.sqrt((x1-x2) * (x1-x2) + (y1-y2) * (y1-y2)); }

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// x and y must be local to the canvas element
// returns -2 if pos was in the middle and -1 if on the outside
function get_chord_btn_at_position(x, y) {
    let btn = 0;
    let position_radius = distance_between_two_points(midX, midY, x, y);

    if (position_radius > mOuterRadius) { return -1; } // pos is outside of all circles
    if (position_radius < mInnerRadius) { return -2; } // pos is in middle circle

    let angle = Math.atan2(midY - y, midX - x); // convert to degrees: angle * 180 / PI
    if (angle < 0) { angle += Math.PI * 2; }

    btn = (angle / (Math.PI * 2) * 12);
    btn -= 2.5; // subtract 3 because index 0 is on the left but we need it on top
    btn = Math.floor(btn);

    if (btn < 0) { btn += 12; }
    if (position_radius < mMidRadius) { btn += 12; }
    return btn;
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%