import { Audio } from 'expo-av';
import React, { useState } from "react";
import { Block, Text } from 'galio-framework';
import axios from 'axios';
import Feather from "react-native-vector-icons/Feather";
import { TextLoader } from 'react-native-indicator';
import * as DocumentPicker from 'expo-document-picker';

Feather.loadFont();
import {
  SafeAreaView,
  StyleSheet,
  useColorScheme,
  Image,
  Dimensions,
  TouchableOpacity
} from 'react-native';

import {
  Colors
} from 'react-native/Libraries/NewAppScreen';

export default function App() {
  const [countOnPress, setCountOnPress] = useState(0);
  const [imagePath, setImagePath] = useState(require('./picture/record-unpress.png'));
  const [recordFlag, setRecordFlag] = useState(true);
  const [captionText, setCaptionText] = useState(`press button to record \nor open file to look emotional`);
  const isDarkMode = useColorScheme() === 'light';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const [recording, setRecording] = useState();
  const [axiosData, setAxiosData] = useState(null);
  const [fromAxios, setFromAxios] = useState(false);
  const [isFetch, setIsFetch] = useState(false);

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();

      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
        );

        setRecording(recording);
      } else {
        alert("Please grant permission to app to access microphone");
      }
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await recording.createNewLoadedSoundAsync();
    await goForAxios(recording.getURI())

    // console.log(recording.getURI());
  }

  async function goForAxios(uri) {
    setFromAxios(true);
    setIsFetch(true);
    setCaptionText('Processing');
    axios.get("http://localhost:3001/predictor")
      .then(response => {
        console.log('getting data from axios', response.data.result);
        console.log(uri);
        setTimeout(() => {
          setIsFetch(false);
          setAxiosData(require('./picture/happy.png'));
          setCaptionText('Happy');
        }, 2000)
      })
      .catch(error => {
        setIsFetch(false);
        setAxiosData(require('./picture/error.png'));
        setCaptionText('Please try again');
        console.log(error);
      });
  };

  async function onPressButton() {
    console.log("button pressed")
    setRecordFlag(!recordFlag);
    if (recordFlag == true) {
      setFromAxios(false)
      setCountOnPress(countOnPress + 1);
      setImagePath(require('./picture/record-press.png'));
      setCaptionText('recording');
      await startRecording();
    } else {
      setAxiosData(null);
      setImagePath(require('./picture/record-unpress.png'));
      setCaptionText(`press button to record \nor open file to look emotional`);
      if (countOnPress > 0) {
        await stopRecording();
      }
    }
  };

  async function pickDocument() {
    let result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
    console.log(result);
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <Block height={50} safe fluid />
      <Block middle style={[styles.card, { backgroundColor: isDarkMode ? "#F3F3F3" : null }]}>
        <Block middle height={300}>
          {fromAxios ?
            <Image style={styles.imageCard} source={axiosData} /> :
            <Image style={styles.imageCard} source={require('./picture/landing.png')} />
          }
        </Block>
        <Block center height={80}>
          {recordFlag && !isFetch ?
            <Text p bold center style={{ marginTop: 30 }}>
              {captionText}
            </Text> :
            <TextLoader text={captionText} textStyle={styles.textStatus} />
          }
        </Block>
      </Block>
      <Block height={80} safe center fluid style={{ marginTop: 50 }}>
        <TouchableOpacity onPress={onPressButton}>
          <Image style={styles.imageButton} source={imagePath} />
        </TouchableOpacity>
      </Block>
      <Block height={200} safe>
        <Text p bold center style={{ marginTop: 80, color: isDarkMode ? "#F3F3F3" : "#727272" }}
          onPress={recordFlag? pickDocument : null} 
        >
          open from file
        </Text>
      </Block>
      <Block height={height} safe />
    </SafeAreaView>
  );
}

const { height, width } = Dimensions.get('screen');
const styles = StyleSheet.create({
  card: {
    marginHorizontal: 25,
    borderRadius: 25,
    height: 450
  },
  imageCard: {
    height: 270,
    width: 270,
    resizeMode: 'contain'
  },
  imageButton: {
    height: 100,
    width: 100,
    resizeMode: 'contain'
  },
  textStatus: {
    marginTop: 30,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20
  }
});