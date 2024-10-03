import {
  useState,
  useRef,
  useMemo,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react';
import {
  Animated,
  Easing,
  Image,
  View,
  type StyleProp,
  type ViewStyle,
  type ImageStyle,
  type ImageURISource,
  type ImageRequireSource,
} from 'react-native';

export interface SpritesMethods {
  play: (options: PlayOptions) => void;
  stop: (cb?: () => void) => void;
  reset: (cb?: () => void) => void;
}

export interface PlayOptions {
  type: string;
  fps?: number;
  loop?: boolean;
  resetAfterFinish?: boolean;
  onFinish?: () => void;
}

export interface SpritesProps {
  source: ImageRequireSource | ImageURISource;
  columns: number;
  rows: number;
  // animations: Record<string, number[]>;
  animations: Record<
    string,
    { row: number; startFrame: number; endFrame: number }
  >;
  viewStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  height?: number;
  width?: number;
  frameWidth?: number;
  frameHeight?: number;
  offsetY?: number;
  offsetX?: number;
  onLoad?: () => void;
  accessible?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

const Sprites = forwardRef<SpritesMethods, SpritesProps>(
  (
    {
      source,
      columns,
      rows,
      animations,
      viewStyle,
      imageStyle,
      height,
      width,
      frameWidth,
      frameHeight,
      offsetY = 0,
      offsetX = 0,
      onLoad,
      accessible = false,
      accessibilityLabel = 'Animated sprite',
      testID = 'sprites-image',
    },
    ref
  ) => {
    if (columns <= 1 || rows < 1) {
      console.warn(
        'Invalid columns or rows. At least 2 columns and 1 row are required.'
      );
    }

    const DEFAULT_FPS = 24;

    const [imageDimensions, setImageDimensions] = useState<{
      width: number;
      height: number;
    }>({
      width: 0,
      height: 0,
    });

    // Load image dimensions
    // useEffect(() => {
    //   const resolvedSource = Image.resolveAssetSource(source);

    //   if (resolvedSource?.width && resolvedSource?.height) {
    //     setImageDimensions({
    //       width: resolvedSource.width,
    //       height: resolvedSource.height,
    //     });
    //   } else {
    //     console.warn('Failed to resolve image dimensions.');
    //   }
    // }, [source]);

    useEffect(() => {
      // Step 1: Use user-provided dimensions if available
      if (width && height) {
        setImageDimensions({ width, height });
        return;
      }

      // Step 2: Handle local images
      if (typeof source === 'number') {
        const resolvedSource = Image.resolveAssetSource(source);

        if (resolvedSource?.width && resolvedSource?.height) {
          setImageDimensions({
            width: resolvedSource.width,
            height: resolvedSource.height,
          });
        } else {
          console.error(
            'Failed to resolve image dimensions for the local image.'
          );
        }
        return;
      } else if (source?.uri) {
        Image.getSize(
          source.uri,
          (imgWidth, imgHeight) => {
            setImageDimensions({ width: imgWidth, height: imgHeight });
          },
          (error) => {
            console.error('Failed to get remote image dimensions:', error);
          }
        );
        return;
      }

      // Step 4: Invalid image source
      console.error('Invalid image source or missing dimensions.');
    }, [source, width, height]);

    // Calculate frame dimensions
    const computedFrameWidth = useMemo(() => {
      if (frameWidth) return frameWidth;
      if (width) return width / columns;
      return imageDimensions.width / columns;
    }, [frameWidth, width, columns, imageDimensions.width]);

    const computedFrameHeight = useMemo(() => {
      if (frameHeight) return frameHeight;
      if (height) return height / rows;
      return imageDimensions.height / rows;
    }, [frameHeight, height, rows, imageDimensions.height]);

    // Calculate image display size while preserving aspect ratio
    const [displayWidth, displayHeight] = useMemo(() => {
      if (width && height) {
        return [width, height];
      } else if (width) {
        const computedHeight =
          (imageDimensions.height / imageDimensions.width) * width;
        return [width, computedHeight];
      } else if (height) {
        const computedWidth =
          (imageDimensions.width / imageDimensions.height) * height;
        return [computedWidth, height];
      } else {
        return [imageDimensions.width, imageDimensions.height];
      }
    }, [width, height, imageDimensions.width, imageDimensions.height]);

    const animatedValue = useRef(new Animated.Value(0)).current;
    const [animationType, setAnimationType] = useState<string | null>(null);

    // Define default Animated.Values using useRef to ensure they are created only once
    const defaultTranslateX = useRef(new Animated.Value(0)).current;
    const defaultTranslateY = useRef(new Animated.Value(0)).current;

    // Calculates the translation needed to display the specified frame.
    const getFrameCoords = useCallback(
      (frameIndex: number): { translateX: number; translateY: number } => {
        const totalFrames = columns * rows;

        if (frameIndex < 0 || frameIndex >= totalFrames) {
          if (__DEV__) {
            console.warn(
              `Frame index ${frameIndex} is out of bounds (0-${totalFrames - 1}). Returning (0,0).`
            );
          }
          return { translateX: 0, translateY: 0 };
        }

        const column = frameIndex % columns;
        const row = Math.floor(frameIndex / columns);
        const translateX = -column * computedFrameWidth - offsetX;
        const translateY = -row * computedFrameHeight - offsetY;

        return { translateX, translateY };
      },
      [columns, computedFrameWidth, computedFrameHeight, offsetX, offsetY, rows]
    );

    // Generate animation frames
    const generateFrames = useCallback(
      (
        row: number,
        startFrame: number,
        endFrame: number,
        totalColumns: number
      ): number[] => {
        const baseFrame = row * totalColumns;
        const frames: number[] = [];
        for (let i = startFrame; i <= endFrame; i++) {
          frames.push(baseFrame + i);
        }
        return frames;
      },
      [] // No dependencies since all parameters are passed directly
    );

    // Generate interpolation ranges for each animation
    const interpolationRanges = useMemo(() => {
      const ranges: Record<
        string,
        {
          translateX: { input: number[]; output: number[] };
          translateY: { input: number[]; output: number[] };
        }
      > = {};

      // Skip this animation with less than 2 frames
      Object.entries(animations).forEach(([key, anim]) => {
        const { row, startFrame, endFrame } = anim;
        const frames = generateFrames(row, startFrame, endFrame, columns);

        if (frames.length < 2) {
          console.warn(
            `Animation "${key}" requires at least 2 frames, but received ${frames.length}.`
          );
          return;
        }

        const inputRange: number[] = [];
        const outputRangeX: number[] = [];
        const outputRangeY: number[] = [];

        frames.forEach((frameIndex, index) => {
          // Duplicate each frame's range to create a step animation
          inputRange.push(index, index + 1);
          const coords = getFrameCoords(frameIndex);
          outputRangeX.push(coords.translateX, coords.translateX);
          outputRangeY.push(coords.translateY, coords.translateY);
        });

        ranges[key] = {
          translateX: { input: inputRange, output: outputRangeX },
          translateY: { input: inputRange, output: outputRangeY },
        };
      });

      return ranges;
    }, [animations, columns, generateFrames, getFrameCoords]);

    // Get current interpolation ranges
    const currentInterpolation = useMemo(() => {
      if (!animationType || !interpolationRanges[animationType]) {
        return {
          translateX: defaultTranslateX,
          translateY: defaultTranslateY,
        };
      }

      const { translateX, translateY } = interpolationRanges[animationType];

      const translateXInterp =
        translateX.input.length >= 2 && translateX.output.length >= 2
          ? animatedValue.interpolate({
              inputRange: translateX.input,
              outputRange: translateX.output,
              extrapolate: 'clamp',
            })
          : defaultTranslateX;

      const translateYInterp =
        translateY.input.length >= 2 && translateY.output.length >= 2
          ? animatedValue.interpolate({
              inputRange: translateY.input,
              outputRange: translateY.output,
              extrapolate: 'clamp',
            })
          : defaultTranslateY;

      return {
        translateX: translateXInterp,
        translateY: translateYInterp,
      };
    }, [
      animationType,
      interpolationRanges,
      animatedValue,
      defaultTranslateX,
      defaultTranslateY,
    ]);

    // Stop animation when the component unmounts
    useEffect(() => {
      return () => {
        animatedValue.stopAnimation();
      };
    }, [animatedValue]);

    // Animation methods

    const play = useCallback(
      ({
        type,
        fps = DEFAULT_FPS,
        loop = false,
        resetAfterFinish = false,
        onFinish = () => {},
      }: PlayOptions) => {
        if (!animations[type]) {
          console.error(`Animation type "${type}" not found.`);
          return;
        }

        const { row, startFrame, endFrame } = animations[type];
        const frames = generateFrames(row, startFrame, endFrame, columns);

        if (frames.length < 2) {
          console.error(
            `Animation "${type}" requires at least 2 frames, but received ${frames.length}.`
          );
          return;
        }

        setAnimationType(type);
        animatedValue.setValue(0);

        const duration = (frames.length / fps) * 1000; // Duration in milliseconds

        const animation = Animated.timing(animatedValue, {
          toValue: frames.length, // To match inputRange
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        });

        if (loop) {
          Animated.loop(animation).start();
        } else {
          animation.start(() => {
            if (resetAfterFinish) {
              animatedValue.setValue(0);
            }
            onFinish();
          });
        }
      },
      [animations, generateFrames, columns, animatedValue]
    );

    const stop = useCallback(
      (cb?: () => void) => {
        animatedValue.stopAnimation(cb);
      },
      [animatedValue]
    );

    const reset = useCallback(
      (cb?: () => void) => {
        animatedValue.stopAnimation(cb);
        animatedValue.setValue(0);
      },
      [animatedValue]
    );

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      play,
      stop,
      reset,
    }));

    // Image transform styles
    const animatedImageStyle = useMemo<StyleProp<ImageStyle>>(
      () => [
        imageStyle,
        {
          width: displayWidth,
          height: displayHeight,
          transform: [
            { translateX: currentInterpolation.translateX },
            { translateY: currentInterpolation.translateY },
          ],
        },
      ],
      [imageStyle, displayWidth, displayHeight, currentInterpolation]
    );

    // Container style
    const containerStyles = useMemo<StyleProp<ViewStyle>>(
      () => [
        viewStyle,
        {
          width: computedFrameWidth,
          height: computedFrameHeight,
          overflow: 'hidden',
        },
      ],
      [viewStyle, computedFrameWidth, computedFrameHeight]
    );

    return (
      <View style={containerStyles} testID={`${testID}-container`}>
        {imageDimensions.width > 0 && imageDimensions.height > 0 && (
          <Animated.Image
            source={source}
            style={animatedImageStyle}
            onLoad={onLoad}
            resizeMode="cover"
            testID={testID}
            accessible={accessible}
            accessibilityLabel={accessibilityLabel}
          />
        )}
      </View>
    );
  }
);

export default Sprites;
