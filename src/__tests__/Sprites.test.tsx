// Sprites.test.tsx

import React from 'react';
import { render, act } from '@testing-library/react-native';
import Sprites, { type SpritesMethods, type SpritesProps } from '../Sprites';
import { Animated, Image, StyleSheet } from 'react-native';

// Mock Image.resolveAssetSource to return image dimensions
jest.mock('react-native/Libraries/Image/Image', () => {
  const RealComponent = jest.requireActual(
    'react-native/Libraries/Image/Image'
  );
  return {
    ...RealComponent,
    resolveAssetSource: jest.fn(() => ({
      width: 256,
      height: 256,
    })),
  };
});

describe('Sprites Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to mock Image.getSize
  const mockGetSize = () => {
    jest
      .spyOn(Image, 'getSize')
      .mockImplementation(
        (
          _uri: string,
          successCallback: (width: number, height: number) => void,
          _failureCallback?: (error: any) => void
        ) => {
          successCallback(256, 256);
        }
      );
  };

  // Helper function to render with mocked Image.getSize and optional ref
  const renderWithMockGetSize = (
    props: SpritesProps,
    ref?: React.Ref<SpritesMethods>
  ) => {
    mockGetSize();
    return render(<Sprites {...props} ref={ref} />);
  };

  // Common constants
  const defaultSource = { uri: 'test_image.png' };
  const defaultAnimations = {
    run: { row: 0, startFrame: 0, endFrame: 4 },
  };
  const defaultProps: SpritesProps = {
    source: defaultSource,
    columns: 5,
    rows: 1,
    animations: defaultAnimations,
  };

  it('renders without errors', () => {
    const { getByTestId } = renderWithMockGetSize(defaultProps);
    expect(getByTestId('sprites-image')).toBeTruthy();
  });

  it('calculates frame dimensions correctly', async () => {
    const props: SpritesProps = {
      ...defaultProps,
      source: { uri: 'sprite_sheet.png' },
      columns: 4,
      rows: 4,
    };

    const { getByTestId } = renderWithMockGetSize(props);

    // Wait for useEffect to run
    await act(async () => {});

    const container = getByTestId('sprites-image-container');
    const containerStyles = container.props.style;
    const flattenedStyles = StyleSheet.flatten(containerStyles);

    expect(flattenedStyles.width).toBe(64); // 256 / 4 columns
    expect(flattenedStyles.height).toBe(64); // 256 / 4 rows
  });

  it('exposes play, stop, and reset methods', () => {
    const ref = React.createRef<SpritesMethods>();
    renderWithMockGetSize(defaultProps, ref);

    expect(ref.current).toBeDefined();
    expect(typeof ref.current?.play).toBe('function');
    expect(typeof ref.current?.stop).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
  });

  it('starts animation when play is called', () => {
    const ref = React.createRef<SpritesMethods>();
    renderWithMockGetSize(defaultProps, ref);

    const animatedValueSetValueSpy = jest.spyOn(
      Animated.Value.prototype,
      'setValue'
    );
    const timingSpy = jest.spyOn(Animated, 'timing').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);

    act(() => {
      ref.current?.play({ type: 'run' });
    });

    expect(animatedValueSetValueSpy).toHaveBeenCalledWith(0);
    expect(timingSpy).toHaveBeenCalled();

    const duration = (5 / 24) * 1000; // frames.length is 5 (indices 0 to 4)
    expect(timingSpy).toHaveBeenCalledWith(expect.any(Animated.Value), {
      toValue: 5,
      duration,
      easing: expect.any(Function),
      useNativeDriver: true,
    });
  });

  it('starts looping animation when play is called with loop=true', () => {
    const ref = React.createRef<SpritesMethods>();
    renderWithMockGetSize(defaultProps, ref);

    const timingMock = {
      start: jest.fn(),
      stop: jest.fn(),
    };
    jest.spyOn(Animated, 'timing').mockReturnValue(timingMock as any);

    const loopMock = {
      start: jest.fn(),
      stop: jest.fn(),
    };
    jest.spyOn(Animated, 'loop').mockReturnValue(loopMock as any);

    act(() => {
      ref.current?.play({ type: 'run', loop: true });
    });

    expect(Animated.loop).toHaveBeenCalledWith(timingMock);
    expect(loopMock.start).toHaveBeenCalled();
  });

  it('stop method stops the animation', () => {
    const ref = React.createRef<SpritesMethods>();
    renderWithMockGetSize(defaultProps, ref);

    const stopAnimationSpy = jest.spyOn(
      Animated.Value.prototype,
      'stopAnimation'
    );

    act(() => {
      ref.current?.stop();
    });

    expect(stopAnimationSpy).toHaveBeenCalled();
  });

  it('reset method resets the animation', () => {
    const ref = React.createRef<SpritesMethods>();
    renderWithMockGetSize(defaultProps, ref);

    const stopAnimationSpy = jest.spyOn(
      Animated.Value.prototype,
      'stopAnimation'
    );
    const setValueSpy = jest.spyOn(Animated.Value.prototype, 'setValue');

    act(() => {
      ref.current?.reset();
    });

    expect(stopAnimationSpy).toHaveBeenCalled();
    expect(setValueSpy).toHaveBeenCalledWith(0);
  });

  it('warns when columns <= 1 or rows < 1', () => {
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const props = {
      ...defaultProps,
      columns: 1,
      rows: 0,
    };

    renderWithMockGetSize(props);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Invalid columns or rows. At least 2 columns and 1 row are required.'
    );
    consoleWarnSpy.mockRestore();
  });

  it('warns when animation has less than 2 frames', () => {
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const animations = {
      run: { row: 0, startFrame: 0, endFrame: 0 },
    };

    const props = {
      ...defaultProps,
      animations,
    };

    renderWithMockGetSize(props);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Animation "run" requires at least 2 frames, but received 1.'
    );
    consoleWarnSpy.mockRestore();
  });

  it('uses user-provided width and height if available', () => {
    const getSizeSpy = jest.spyOn(Image, 'getSize');

    const props: SpritesProps = {
      ...defaultProps,
      width: 600,
      height: 400,
    };

    render(<Sprites {...props} />);
    expect(getSizeSpy).not.toHaveBeenCalled();
  });

  it('resolves dimensions for local image source', () => {
    const source = 1; // Mock local image resource ID

    const resolveAssetSourceSpy = jest
      .spyOn(Image, 'resolveAssetSource')
      .mockReturnValue({
        width: 500,
        height: 500,
        scale: 1,
        uri: '',
      });

    const props = {
      ...defaultProps,
      source,
    };

    render(<Sprites {...props} />);
    expect(resolveAssetSourceSpy).toHaveBeenCalledWith(source);
  });

  it('calls onFinish after animation ends', () => {
    jest.useFakeTimers();

    const onFinishMock = jest.fn();

    const ref = React.createRef<SpritesMethods>();
    renderWithMockGetSize(defaultProps, ref);

    const timingMock = {
      start: (callback: () => void) => {
        setTimeout(callback, 1000);
      },
      stop: jest.fn(),
    };
    jest.spyOn(Animated, 'timing').mockReturnValue(timingMock as any);

    act(() => {
      ref.current?.play({ type: 'run', onFinish: onFinishMock });
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(onFinishMock).toHaveBeenCalled();
  });
});
