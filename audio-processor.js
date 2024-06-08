
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

class NoteBuffer {
  constructor() {
    this.mSampleEndPos = 0; // index of the last sample in the buffer
    this.mRootNote = 60;
    this.mRootNoteFreq = 261.625565;
    this.mSampleRate = 44100.0; // sample rate of the loaded audio file xxx
    this.mBufferL= new Array(this.mMaxBufferSize).fill(0);
    this.mBufferR = new Array(this.mMaxBufferSize).fill(0);
  }
};

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

class VoiceObj {
  constructor() {
    this.mNoteBufferIdx = 0;
    this.mStringNr = 0;
    this.mIsPlaying = false;
    this.sample_count = 0;
    this.released_at_sample = -1;
    this.noteFrequency = 0.0;
    this.vel = 1.0;
    this.pos = 0.0; // the index for the sample buffer (the interpolated sample_pos)
    this.increment = 1.0; // calculated in noteOn()
  }
};

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

class AudioProcessor extends AudioWorkletProcessor {

  constructor() {
    super();
    this.port.onmessage = this.handleMessage.bind(this);
    this.mOutputSampleRate = 48000;
    this.fastReleaseMs = 12.0; // milliseconds
    this.fastRelSamples = Math.max(this.fastReleaseMs / 1000.0 * this.mOutputSampleRate, 0.0001);
    this.mMaxVoiceAmount = 8; // 2 voices per string is enough
    this.mMaxBufferSize = this.mOutputSampleRate * 5;

    this.decayMs = 1000; // milliseconds
    this.decaySamples = Math.max(this.decayMs / 1000.0 * this.mOutputSampleRate, 0.0001); // calculated in "process()"
    
    // normalized value, no setter method needed
    this.mVolume = 0.5;

    // contains elements of type NoteBuffer only, 0 to 3 are up samples, 4 to 7 are down samples
    this.mNoteBuffers = [];
    for (let i = 0; i < 8; i++) { this.mNoteBuffers.push(new NoteBuffer()); }

    // contains elements of type VoiceObj only
    this.mVoices = [];
    for (let i = 0; i < this.mMaxVoiceAmount; i++) { this.mVoices.push(new VoiceObj()); }
  }

  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  handleMessage(event) {
    const data = event.data;

    // https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer
    // data: channelLeft, channelRight, rootNote, sampleIdx
    if (data.type === 'loadBuffer') {
      let noteBuffer = this.mNoteBuffers[data.sampleIdx];
      noteBuffer.mRootNote = data.rootNote;;
      noteBuffer.mRootNoteFreq = this.note_to_freq(noteBuffer.mRootNote);
      //noteBuffer.mSampleRate = data.buffer.sampleRate;

      let leftChannel = data.channelLeft;
      let rightChannel = data.channelRight;
      noteBuffer.mSampleEndPos = Math.min(leftChannel.length, this.mMaxBufferSize);

      // multiplier is required as each sample was normalized (in FLStudio) which would mean an amplitude of 4 when strumming
      const multiplier = 1.0 / 4.0;
      for (let s = 0; s < noteBuffer.mSampleEndPos; s++) {
        noteBuffer.mBufferL[s] = leftChannel[s] * multiplier;
        noteBuffer.mBufferR[s] = rightChannel[s] * multiplier;
      }
    }
    else if (data.type === 'noteOn') {
      this.noteOn(data.noteNr, data.stringNr, data.playStyle)
    }
  }

  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  // playStyle: 0 = down, 1 = up, 2 = pick
  noteOn = (note_int, stringNr_int, playStyle_int) => {

    this.stringOff(stringNr_int);

    for (let i = 0; i < this.mVoices.length; i++) {
      const v = this.mVoices[i];

      if (!v.mIsPlaying) {
        v.sample_count = 0;
        v.released_at_sample = -1;
        v.pos = 0.0;
        v.mStringNr = stringNr_int;

        //v.noteFrequency = note_to_freq(note - 0.3176665363342928); // A4 = 432Hz
        v.noteFrequency = this.note_to_freq(note_int);               // A4 = 440Hz

        if      (note_int < 63) { v.mNoteBufferIdx = 0; } // C Sample
        else if (note_int < 66) { v.mNoteBufferIdx = 1; } // E Sample
        else if (note_int < 69) { v.mNoteBufferIdx = 2; } // G Sample
        else                    { v.mNoteBufferIdx = 3; } // A Sample

        // 0 to 3 are up samples, 4 to 7 are down samples
        if (playStyle_int == 1) { v.mNoteBufferIdx += 4; }
        let noteBuffer = this.mNoteBuffers[v.mNoteBufferIdx];

        // this also does resample from the sample rate of the loaded sample to the sample rate of the output stream
        // not required as "audioContext.decodeAudioData()"" already does resample the audio
        //v.increment = v.noteFrequency / noteBuffer.mRootNoteFreq * (noteBuffer.mSampleRate / this.mOutputSampleRate);

        v.increment = v.noteFrequency / noteBuffer.mRootNoteFreq; // no resampling

        v.mIsPlaying = true;
        break;
      }
    }
  }

  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  stringOff = (stringNr_int) => {
    for (let i = 0; i < this.mVoices.length; i++) {
      const v = this.mVoices[i];
      if (v.mIsPlaying && v.released_at_sample == -1 && v.mStringNr == stringNr_int) {
        v.released_at_sample = v.sample_count;
      }
    }
  }

  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  // 8.1758 = the frequency of c-2 or key 0
  note_to_freq(note_nr) { return 8.1758 * Math.pow(2.0, note_nr / 12.0); }

  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channelCount = output.length;
    const nFrames = output[0].length;

    this.decaySamples = Math.max(this.decayMs / 1000.0 * this.mOutputSampleRate, 0.0001);

    for (let s = 0; s < nFrames; s++) {
      let total_sampleL = 0, total_sampleR = 0;

      for (let i = 0; i < this.mVoices.length; i++) {
        const v = this.mVoices[i];
        if (!v.mIsPlaying) { continue; }
        let sampleL = 0.0, sampleR = 0.0;

        const noteBuffer = this.mNoteBuffers[v.mNoteBufferIdx];

        if (v.sample_count < noteBuffer.mSampleEndPos) {
          sampleL = noteBuffer.mBufferL[v.sample_count];
          sampleR = noteBuffer.mBufferR[v.sample_count];
        }
        else {
          v.mIsPlaying = false;
          continue;
        }
        //========================================= fast release
        if (v.released_at_sample > -1) {
          let samples = v.sample_count - v.released_at_sample;
          let progress = samples / this.fastRelSamples;

          if (progress >= 1.0) {
            v.mIsPlaying = false;
            continue;
          }
          sampleL *= (1- progress);
          sampleR *= (1- progress);
        }
        //========================================= decay
        let decayProg = 1 - v.sample_count / this.decaySamples;
        if (decayProg <= 0) {
            v.mIsPlaying = false;
            continue;
        }
        sampleL *= decayProg;
        sampleR *= decayProg;
        //=========================================
        sampleL *= v.vel;
        sampleR *= v.vel;
        total_sampleL += sampleL;
        total_sampleR += sampleR;
        //========================================= update sample count and playback position of the current voice
        v.sample_count++;
        v.pos += v.increment;
      }
      //=========================================== add the total sample to the output
      output[0][s] = total_sampleL;
      output[1][s] = total_sampleR;
    }

    // // apply volume and clamp between -1 and 1
    for (let i = 0; i < nFrames; i++) {
      output[0][i] = Math.max(Math.min(output[0][i] * this.mVolume, 1), -1);
      output[1][i] = Math.max(Math.min(output[1][i] * this.mVolume, 1), -1);
    }

    // noise ...
    // for (let i = 0; i < nFrames; i++) {
    //   output[0][i] += (Math.random() * 2 - 1) * 0.1;
    //   output[1][i] += (Math.random() * 2 - 1) * 0.1;
    // }

    return true; // Keep the processor alive
  }
}

registerProcessor('audio-processor', AudioProcessor);

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
