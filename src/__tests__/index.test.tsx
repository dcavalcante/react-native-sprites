import * as Library from '../index';

describe('Library Exports', () => {
  test('should export Sprites component', () => {
    expect(Library.Sprites).toBeDefined();
  });

  test('should export SpritesProps type', () => {
    const props: Library.SpritesProps = {} as any;
    expect(props).toBeDefined();
  });

  test('should export SpritesMethods type', () => {
    const control: Library.SpritesMethods = {
      play: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    };
    expect(control).toBeDefined();
  });
});
