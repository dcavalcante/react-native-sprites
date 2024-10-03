import { useRef, useState, useEffect } from 'react';
import {
  View,
  Button,
  Text,
  Switch,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Sprites, type SpritesMethods } from 'react-native-sprites';

const App = () => {
  const spriteRef = useRef<SpritesMethods>(null);
  const [loop, setLoop] = useState<boolean>(true);
  const [fps, setFPS] = useState<number>(15);
  const [inputFPS, setInputFPS] = useState<string>('15');
  const [currentAnimation, setCurrentAnimation] = useState<string>('down');

  // useEffect to handle changes in fps or loop and update the current animation
  useEffect(() => {
    if (currentAnimation) {
      spriteRef.current?.play({
        type: currentAnimation,
        fps,
        loop,
      });
    }
  }, [fps, loop, currentAnimation]);

  const handlePlay = (type: string) => {
    setCurrentAnimation(type);
    spriteRef.current?.play({
      type,
      fps,
      loop,
    });
    console.log(`Playing animation: ${type}`);
  };

  const handleStop = () => {
    spriteRef.current?.stop(() => console.log('Animation stopped'));
  };

  const handleFPS = (text: string) => {
    setInputFPS(text); // Update raw input value first

    const parsedFPS = Number(text);
    if (!isNaN(parsedFPS) && parsedFPS > 0) {
      setFPS(parsedFPS); // Only update FPS if valid
      spriteRef.current?.play({
        type: currentAnimation,
        fps: parsedFPS,
        loop,
      });
    } else {
      spriteRef.current?.stop(() => {
        console.log('Animation stopped due to invalid FPS input');
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sprite}>
        <Sprites
          ref={spriteRef}
          source={require('../assets/goat.png')}
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
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <Text>Loop: </Text>
          <Switch value={loop} onValueChange={(value) => setLoop(value)} />
        </View>
        <View style={styles.controlRow}>
          <Text>FPS: </Text>
          <TextInput
            value={inputFPS}
            onChangeText={handleFPS}
            keyboardType="numeric"
          />
        </View>
        <View>
          <Text>Animation:</Text>
          <View style={styles.buttons}>
            <Button title="Down" onPress={() => handlePlay('down')} />
            <Button title="Left" onPress={() => handlePlay('left')} />
            <Button title="Right" onPress={() => handlePlay('right')} />
            <Button title="Up" onPress={() => handlePlay('up')} />
            <Button title="Stop" onPress={handleStop} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  sprite: {
    marginBottom: 20,
  },
  controls: {
    width: '80%',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
});

export default App;
