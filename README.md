# React Native Sprites

A React Native component for rendering and animating sprite sheets.

## Features

- Play, stop and reset animations using simple methods.
- Define multiple animations with customizable frame sequences.
- Uses React Native's `Animated` API and interpolation for smooth animations. 

## Installation

Install the package using yarn (preferred) or npm:
```sh
yarn add react-native-sprites
```

or:
```sh
npm install react-native-sprites
```

## Usage

Import the `Sprites` component into your React Native component. You need the `useRef` hook to keep a reference which will be used to control the animation. For **TypeScript** projects, there's a `SpritesMethods` interface available.

Initialize a reference with `useRef` and pass it to `Sprites` as the `ref` property. Also pass a local file with `require` for the `source` prop, the number of `columns` and `rows` of the sprites, and `animations` accepts an object whose keys define each animation name, and the value is an object that takes the `row`, `startFrame` and `endFrame`.

```js
import React, { useRef } from 'react';
import { View } from 'react-native';
import Sprites, { type SpritesMethods } from 'react-native-sprites';

const MySpriteComponent = () => {
  const spriteRef = useRef<SpritesMethods>(null);

  return (
    <View>
      <Sprites
        ref={spriteRef}
        source={require('../assets/goat.png')} // Local image
        columns={3}
        rows={4}
        animations={{
          down: { row: 0, startFrame: 0, endFrame: 2 },
          left: { row: 1, startFrame: 0, endFrame: 2 },
          right: { row: 2, startFrame: 0, endFrame: 2 },
          up: { row: 3, startFrame: 0, endFrame: 2 },
        }}
      />
    </View>
  );
};

export default MySpriteComponent;

```

### Animation control methods

The `Sprites` component exposes control methods via a ref. These methods allow you to control the animation imperatively.

### **`play(options: PlayOptions)`**

Starts playing an animation.

#### **`PlayOptions` Parameters:**

- **`type`** (`string`): **Required.** The animation type to play, as defined in the `animations` prop.
- **`fps`** (`number`): Frames per second for the animation. Default is `24`.
- **`loop`** (`boolean`): Whether the animation should loop. Default is `false`.
- **`resetAfterFinish`** (`boolean`): Whether to reset the animation to the first frame after it finishes. Default is `false`.
- **`onFinish`** (`() => void`): Callback function that is called when the animation finishes playing.

**Example:**

```jsx
spriteRef.current?.play({
  type: 'walk',
  fps: 12,
  loop: true,
  resetAfterFinish: false,
  onFinish: () => {
    console.log('Animation finished');
  },
});
```

### **`stop(cb?: () => void)`**

Stops the current animation.

- **`cb`** (`() => void`, optional): Callback function that is called when the animation stops.

**Example:**

```jsx
spriteRef.current?.stop(() => {
  console.log('Animation stopped');
});
```

### **`reset(cb?: () => void)`**

Resets the animation to the first frame.

- **`cb`** (`() => void`, optional): Callback function that is called after the animation is reset.

**Example:**

```jsx
spriteRef.current?.reset(() => {
  console.log('Animation reset');
});
```

### Defining Animations

Animations are defined using the `animations` prop, which is an object mapping animation names to objects containing the row number and the start and end frame indices within that row.

- **Frames and Row Indices**: Start from `0` and correspond to frames in the sprite sheet, counted left to right, top to bottom.
- **Minimum Frames**: Each animation should have at least **2 frames** to animate.

**Example:**

```jsx
const animations = {
  walk: { row: 0, startFrame: 0, endFrame: 4 },
  run: { row: 1, startFrame: 0, endFrame: 4 },
  jump: { row: 2, startFrame: 0, endFrame: 2 },
};

```

### Using remote images as source

Pass an object with the key `uri` with the URL as value.

**Example:**

```jsx
<Sprites
  source={{ uri: 'https://example.com/sprites.png' }}
  columns={3}
  rows={4}
  animations={{
    walk: { row: 0, startFrame: 0, endFrame: 4 },
    run: { row: 1, startFrame: 0, endFrame: 4 },
    jump: { row: 2, startFrame: 0, endFrame: 2 },
  }}
/>
```

## Props

Below are the props available for the `Sprites` component:

| Prop          | Type                               | Required | Description                                                                                                                                  |
|---------------|------------------------------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `source`      | `ImageRequireSource \| ImageURISource`              | Yes      | The source of the sprite sheet image. Can be a local image imported using `require()` or an object with the key `uri` with a valid URL as value.                                                      |
| `columns`     | `number`                           | Yes      | Number of columns in the sprite sheet grid.                                                                                                  |
| `rows`        | `number`                           | Yes      | Number of rows in the sprite sheet grid.                                                                                                     |
| `animations`  | `Record<string, { row: number; startFrame: number; endFrame: number }>`         | Yes      | An object mapping animation names to objects defining the `row`, `startFrame` and `endFrame` for each. |
| `viewStyle`   | `StyleProp<ViewStyle>`             | No       | Style for the container view holding the sprite.                                                                                             |
| `imageStyle`  | `StyleProp<ImageStyle>`            | No       | Style for the sprite image.                                                                                                                  |
| `height`      | `number`                           | No       | Height of the sprite container. If not provided, calculated from the image dimensions and `rows`.                                            |
| `width`       | `number`                           | No       | Width of the sprite container. If not provided, calculated from the image dimensions and `columns`.                                          |
| `frameWidth`  | `number`                           | No       | Width of a single frame. Overrides automatic calculation based on `columns`.                                                                 |
| `frameHeight` | `number`                           | No       | Height of a single frame. Overrides automatic calculation based on `rows`.                                                                   |
| `offsetY`     | `number`                           | No       | Vertical offset for the sprite sheet (useful if frames are not perfectly aligned). Default is `0`.                                           |
| `offsetX`     | `number`                           | No       | Horizontal offset for the sprite sheet (useful if frames are not perfectly aligned). Default is `0`.                                         |
| `onLoad`      | `() => void`                       | No       | Callback function that is called when the image is loaded.                                                                                   |

## Example Application

To see `react-native-sprites` in action, refer to the example application included in this repository. The [/example](./example) folder demonstrates how to use the library in a real-world scenario.

### Location of the Example

- **Path**: [`/example/src/App.tsx`](./example/src/App.tsx)

### Running the Example

1. **Install Dependencies**

   From the root of the project, install all dependencies:

   ```bash
   yarn
   ```

2. **Run the Example App**

   For iOS:

   ```bash
   yarn example ios
   ```

   For Android:

   ```bash
   yarn example android
   ```

## Notes

- **Sprite Sheet Alignment**: Ensure your sprite sheet frames are evenly spaced and aligned. Use `offsetX` and `offsetY` if adjustments are needed.
- **Frame Dimensions**: If your frames are not uniform or need specific sizing, use `frameWidth` and `frameHeight` to override automatic calculations.
- **Local Images Only**: Only local images imported using `require()` are supported. Remote images are not supported.
- **Performance Considerations**: Keep the frame size and animation length in mind for performance, especially on lower-end devices.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)

Inspired by the abandoned project [rn-sprite-sheet](https://github.com/mileung/rn-sprite-sheet)