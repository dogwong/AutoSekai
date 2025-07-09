# AutoSekai API Documentation

## Overview

AutoSekai is a Node.js application that automates rhythm game playing through touch input simulation. It can parse music score files (SUS format), play them with precise timing, and send touch commands to target devices via Bluetooth or HID.

## Table of Contents

1. [Core Components](#core-components)
2. [SekaiSusReader API](#sekaisusreader-api)
3. [ScorePlayer API](#scoreplayer-api)
4. [Toucher API](#toucher-api)
5. [Touch API](#touch-api)
6. [BleTouch API](#bletouch-api)
7. [Main Application API](#main-application-api)
8. [Usage Examples](#usage-examples)
9. [Configuration](#configuration)

## Core Components

The application consists of several main components:

- **SekaiSusReader**: Parses SUS music score files into playable note data
- **ScorePlayer**: Manages score playback with precise timing
- **Toucher**: High-level touch input management with queueing
- **Touch**: Low-level touch handling and HID communication
- **BleTouch**: Bluetooth touch communication via D-Bus
- **Main Application**: Interactive console interface for song selection and playback

## SekaiSusReader API

### Class: `SekaiSusReader`

Static utility class for parsing SUS (Sekai format) music score files.

#### Static Methods

##### `Read(sus)`

Parses a SUS file string into structured note data.

**Parameters:**
- `sus` (String): Raw content of a .sus file

**Returns:**
```javascript
{
  timestampNotes: Object[], // Array of note objects with timing
  slides: Object[]         // Array of slide note sequences
}
```

**Note Object Structure:**
```javascript
{
  t: Number,        // Timestamp in milliseconds
  type: String,     // Note type: "tap", "flick", "slide head", etc.
  lane: Number,     // Lane number (2-13 for playable lanes)
  width: Number,    // Note width
  measure: Number,  // Measure number in the score
  raw: Object,     // Raw note data from SUS parser
  slideId: Number, // ID for slide notes (if applicable)
  // Additional properties for specific note types...
}
```

**Example:**
```javascript
const SekaiSusReader = require('./lib/sekai-sus-reader');
const fs = require('fs');

// Read SUS file
const susContent = fs.readFileSync('./music_score/0001_01/master.sus', 'utf8');

// Parse the file
const result = SekaiSusReader.Read(susContent);

console.log(`Loaded ${result.timestampNotes.length} notes`);
console.log(`Found ${result.slides.length} slide sequences`);

// Access first note
const firstNote = result.timestampNotes[0];
console.log(`First note: ${firstNote.type} at ${firstNote.t}ms on lane ${firstNote.lane}`);
```

**Supported Note Types:**
- `"tap"` - Basic tap note
- `"yellow tap"` - Special tap note
- `"flick"` - Flick note (directional swipe)
- `"flick left"` - Left flick
- `"flick right"` - Right flick
- `"slide head"` - Start of slide sequence
- `"slide tail"` - End of slide sequence
- `"slide waypoint hvcombo"` - Slide waypoint with combo
- `"slide waypoint nocombo"` - Slide waypoint without combo
- `"skill"` - Skill activation note
- `"fever"` - Fever mode note
- `"diamond"` - Diamond note on slide

## ScorePlayer API

### Class: `ScorePlayer`

Manages timed playback of music scores with callback-based note triggering.

#### Constructor

```javascript
const player = new ScorePlayer();
```

#### Properties

- `score` (Array): Internal score array (read-only)
- `isPlaying` (Boolean): Current playback state
- `playheadTime` (Number): Current playback time in milliseconds
- `timeshift` (Number): Time offset in milliseconds

#### Methods

##### `Add(ms, payload)`

Adds a note or event to the score at a specific time.

**Parameters:**
- `ms` (Number): Timestamp in milliseconds (must be >= 0)
- `payload` (Object): Note data or custom payload

**Throws:**
- Error if `ms` is negative or not a number

**Example:**
```javascript
const player = new ScorePlayer();

// Add a tap note at 1000ms
player.Add(1000, {
  type: "tap",
  lane: 5,
  width: 1
});

// Add a flick note at 2000ms
player.Add(2000, {
  type: "flick",
  lane: 7,
  width: 2
});
```

##### `Sort()`

Sorts the score by timestamp. Must be called after adding all notes and before playback.

**Example:**
```javascript
player.Add(2000, noteA);
player.Add(1000, noteB);
player.Add(1500, noteC);

player.Sort(); // Notes are now ordered: noteB, noteC, noteA
```

##### `Play(callback, time = 0)`

Starts score playback with optional time offset.

**Parameters:**
- `callback` (Function): Called for each note/event. Receives payload object
- `time` (Number): Starting time offset in milliseconds (default: 0)

**Returns:**
- Promise that resolves when playback completes

**Callback Payload:**
```javascript
{
  t: Number,        // Current timestamp
  objects: Array    // Array of note objects at this timestamp
}
```

**Example:**
```javascript
function noteCallback(payload) {
  console.log(`Time: ${payload.t}ms`);
  payload.objects.forEach(note => {
    console.log(`  Note: ${note.type} on lane ${note.lane}`);
  });
}

await player.Play(noteCallback);
console.log("Playback finished!");

// Start from 5 seconds
await player.Play(noteCallback, 5000);
```

##### `PlayAtFirstNote(callback)`

Starts playback from the timestamp of the first note.

**Parameters:**
- `callback` (Function): Note callback function

**Returns:**
- Promise that resolves when playback completes

**Example:**
```javascript
// Skip silence at beginning of song
await player.PlayAtFirstNote(noteCallback);
```

##### `Stop()`

Stops playback and resets player state.

**Example:**
```javascript
player.Stop();
console.log("Playback stopped");
```

##### `Shift(ms)`

Adjusts the time offset for playback synchronization.

**Parameters:**
- `ms` (Number): Milliseconds to shift (positive = later, negative = earlier)

**Returns:**
- New total timeshift value

**Example:**
```javascript
// Delay all notes by 100ms
player.Shift(100);

// Play notes 50ms earlier
player.Shift(-50);

console.log(`Current timeshift: ${player.timeshift}ms`);
```

## Toucher API

### Class: `Toucher`

High-level touch input manager with automatic queueing and finger management.

#### Static Methods

##### `SendTouch(touches)`

Queues touch actions for execution. Automatically manages finger allocation and timing.

**Parameters:**
- `touches` (Array): Array of touch objects

**Touch Object Structure:**
```javascript
{
  x: Number,  // X coordinate (0-10000 scale)
  y: Number,  // Y coordinate (0-10000 scale)  
  t: Number   // Touch duration in milliseconds
}
```

**Coordinate System:**
- Uses normalized coordinates (0-10000)
- Origin depends on device orientation
- Landscape mode: X=screen height, Y=screen width

**Example:**
```javascript
const Toucher = require('./lib/toucher');

// Single tap at center of screen
Toucher.SendTouch([{
  x: 5000,  // Center X
  y: 5000,  // Center Y
  t: 50     // 50ms touch
}]);

// Flick gesture (multiple rapid touches)
const flickTouches = [];
for (let i = 0; i < 5; i++) {
  flickTouches.push({
    x: 3000 + i * 200,  // Moving X position
    y: 5000,             // Same Y position
    t: 10                // Short duration
  });
}
Toucher.SendTouch(flickTouches);

// Long press
Toucher.SendTouch([{
  x: 2000,
  y: 7000,
  t: 2000  // 2 second press
}]);
```

**Internal Features:**
- Automatic finger allocation (up to 2 simultaneous touches)
- Touch queue management
- Adds small random offset (±2 pixels) for natural variation

## Touch API

### Class: `Touch`

Low-level touch handling with direct HID device communication.

#### Constructor

```javascript
const Touch = require('./lib/touch');
const touch = new Touch(device);
```

**Parameters:**
- `device` (Object): HID device instance or BleTouch instance

#### Methods

##### `moveFingerTo(identifier, x, y)`

Moves a finger to a specific screen position.

**Parameters:**
- `identifier` (Number): Finger ID (0-9)
- `x` (Number): X coordinate (0-10000 scale)
- `y` (Number): Y coordinate (0-10000 scale)

**Returns:**
- Promise that resolves when command is sent

**Example:**
```javascript
// Move finger 0 to position
await touch.moveFingerTo(0, 3000, 4000);

// Move finger 1 to different position
await touch.moveFingerTo(1, 7000, 6000);
```

##### `releaseFinger(identifier)`

Releases a finger from the screen.

**Parameters:**
- `identifier` (Number): Finger ID to release

**Returns:**
- Promise that resolves when command is sent

**Example:**
```javascript
// Release finger 0
await touch.releaseFinger(0);

// Release all fingers
for (let i = 0; i < 10; i++) {
  await touch.releaseFinger(i);
}
```

##### `send(identifier, touch, x, y)`

Low-level method to send raw touch data.

**Parameters:**
- `identifier` (Number): Finger ID
- `touch` (Number): Touch state (0=release, 1=press)
- `x` (Number): X coordinate
- `y` (Number): Y coordinate

**Returns:**
- Promise that resolves when data is sent

## BleTouch API

### Class: `BleTouch`

Bluetooth Low Energy touch communication via D-Bus.

#### Constructor

```javascript
const BleTouch = require('./lib/bleTouch');
const bleTouch = new BleTouch();
```

#### Methods

##### `init()`

Initializes Bluetooth connection and D-Bus interface.

**Returns:**
- Promise that resolves when connection is established

**Example:**
```javascript
const bleTouch = new BleTouch();
await bleTouch.init();
console.log("Bluetooth touch ready");
```

##### `write(data)`

Sends touch data over Bluetooth.

**Parameters:**
- `data` (Array): Touch data array (automatically modified)

**Returns:**
- Promise that resolves when data is sent

**Example:**
```javascript
const touchData = [1, 0, 1, 100, 0, 200, 0, 0x00];
await bleTouch.write(touchData);
```

## Main Application API

The main application (`index.js`) provides an interactive console interface.

### Configuration Constants

```javascript
const FLICK_EARLY = 20;              // ms earlier to perform flick
const SLIDE_UPDATE_FREQUENCY = 30;   // ms touch update interval during slide
```

### Global Objects

- `Musics` (Array): Available songs loaded from static data
- `MusicEnNameMap` (Object): English name mappings for songs

### Interactive Commands

#### Song Selection
- Enter song ID or name with tab completion
- Supports both Japanese and English titles

#### Difficulty Selection
- `e` - Easy
- `n` - Normal  
- `h` - Hard
- `x` - Expert
- `m` - Master

#### Playback Controls
- `'` (apostrophe) - Play from first note
- `↑` - Shift timing +5ms
- `↓` - Shift timing -5ms
- `s` - Stop playback
- `p` - Start automated song sequence
- `o` - Start looped automated sequence
- `l` - Toggle loop mode

#### Test Commands
- `[` - Loop touch test
- `]` - Single touch test
- `t` - Dual touch test
- `y` - Multi-touch flick test

### Lane Position Mapping

```javascript
// Landscape orientation lane positions (normalized 0-10000)
const laneXPositions = [
  2009, 2564, 3120, 3632, 4188, 4722,  // Left side lanes
  5278, 5812, 6368, 6880, 7436, 7991   // Right side lanes
];

const laneYPosition = 7870;  // Fixed Y position for gameplay area
```

## Usage Examples

### Complete Score Playback Example

```javascript
const SekaiSusReader = require('./lib/sekai-sus-reader');
const ScorePlayer = require('./lib/score-player');
const Toucher = require('./lib/toucher');
const fs = require('fs');

async function playScore(songId, difficulty) {
  // Load and parse SUS file
  const susPath = `./music_score/${songId.toString().padStart(4, "0")}_01/${difficulty}.sus`;
  const susContent = fs.readFileSync(susPath, 'utf8');
  const scoreData = SekaiSusReader.Read(susContent);
  
  // Create score player
  const player = new ScorePlayer();
  
  // Add notes to player
  scoreData.timestampNotes.forEach(note => {
    if (note.type.indexOf("flick") >= 0) {
      // Add flick notes slightly early
      player.Add(note.t - 20, note);
    } else {
      player.Add(note.t, note);
    }
  });
  
  player.Sort();
  
  // Define playback callback
  function playCallback(payload) {
    payload.objects.forEach(note => {
      if (note.type.indexOf("tap") >= 0) {
        // Handle tap notes
        Toucher.SendTouch([{
          x: 7870,  // Fixed lane Y position
          y: calculateLanePosition(note.lane, note.width),
          t: 10
        }]);
      } else if (note.type.indexOf("flick") >= 0) {
        // Handle flick notes with gesture
        const flickTouches = [];
        for (let i = 0; i < 7; i++) {
          flickTouches.push({
            x: 7870 + 200 * i,
            y: calculateLanePosition(note.lane, note.width),
            t: 8
          });
        }
        Toucher.SendTouch(flickTouches);
      }
      // Add more note type handlers as needed...
    });
  }
  
  // Start playback
  console.log("Starting playback...");
  await player.Play(playCallback);
  console.log("Playback complete!");
}

function calculateLanePosition(lane, width) {
  const laneXPositions = [2009, 2564, 3120, 3632, 4188, 4722, 5278, 5812, 6368, 6880, 7436, 7991];
  const startPos = laneXPositions[lane - 2];
  const endPos = laneXPositions[lane + width - 2 - 1];
  return Math.round((startPos + endPos) / 2);
}

// Usage
playScore(128, "master");
```

### Custom Touch Sequence Example

```javascript
const Toucher = require('./lib/toucher');

async function customTouchSequence() {
  // Tap sequence across screen
  for (let i = 0; i < 5; i++) {
    Toucher.SendTouch([{
      x: 5000,
      y: 1000 + i * 2000,
      t: 100
    }]);
    
    // Wait between touches
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Simultaneous multi-touch
  Toucher.SendTouch([
    { x: 2000, y: 2000, t: 500 },
    { x: 8000, y: 8000, t: 500 }
  ]);
}

customTouchSequence();
```

### Bluetooth Setup Example

```javascript
const BleTouch = require('./lib/bleTouch');
const Touch = require('./lib/touch');

async function setupBluetooth() {
  // Initialize Bluetooth touch
  const bleTouch = new BleTouch();
  await bleTouch.init();
  
  // Create touch interface
  const touch = new Touch(bleTouch);
  
  // Test touch
  await touch.moveFingerTo(0, 5000, 5000);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await touch.releaseFinger(0);
  
  console.log("Bluetooth touch test complete");
}

// Only run on Linux systems
if (require('os').platform() === 'linux') {
  setupBluetooth();
}
```

## Configuration

### Dependencies

Required npm packages (from package.json):
- `axios` ^0.21.1 - HTTP client
- `dbus-next` ^0.9.1 - D-Bus communication
- `lodash` ^4.17.20 - Utility functions  
- `node-hid` ^2.1.1 - HID device communication
- `sus-analyzer` ^2.2.4 - SUS file parsing

### File Structure

```
project/
├── index.js                 # Main application
├── lib/
│   ├── sekai-sus-reader.js  # SUS file parser
│   ├── score-player.js      # Score playback engine
│   ├── toucher.js          # High-level touch manager
│   ├── touch.js            # Low-level touch handling
│   └── bleTouch.js         # Bluetooth communication
├── music_score/            # SUS score files
│   ├── 0001_01/
│   │   ├── easy.sus
│   │   ├── normal.sus
│   │   └── master.sus
│   └── ...
├── static_data_sekai/      # Game data
│   ├── musics.json
│   └── music_titles_en.json
└── package.json
```

### Platform Requirements

- **Linux**: Full functionality with Bluetooth support
- **Other platforms**: Limited to local testing without touch output

### Hardware Requirements

- Bluetooth Low Energy capability (Linux only)
- Target device with touch input support
- Compatible rhythm game running on target device

## Error Handling

### Common Issues

1. **Missing SUS files**: Check `music_score/` directory structure
2. **Bluetooth connection failed**: Verify D-Bus service is running
3. **Touch not working**: Ensure correct device pairing and permissions
4. **Timing issues**: Use `Shift()` method to adjust synchronization

### Debugging

Enable debug mode in ScorePlayer:
```javascript
const player = new ScorePlayer();
player.DEBUG = true;  // Enables debug timing mode
```

Access global debug objects in main application:
```javascript
global.susData   // Raw SUS analyzer output
global.noteObj   // Processed note objects
```

This completes the comprehensive API documentation for the AutoSekai project. All public APIs, functions, and components are documented with detailed examples and usage instructions.