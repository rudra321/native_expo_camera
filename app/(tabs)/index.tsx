import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import Constants from "expo-constants";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import Button from "../../components/Button";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function App() {
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [images, setImages] = useState<string[]>([]);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [flash, setFlash] = useState(Camera.Constants.FlashMode.off);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === "granted");
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const { uri } = await cameraRef.current.takePictureAsync();
        await savePicture(uri);
      } catch (error) {
        console.error("Error taking picture:", error);
      }
    }
  };

  const savePicture = async (uri: string) => {
    try {
      const asset = await MediaLibrary.createAssetAsync(uri);
      setImages((prevImages) => [...prevImages, asset]);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Image saved to gallery successfully",
      });
    } catch (error) {
      console.error("Error saving picture:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save image",
      });
    }
  };

  const deletePicture = async (index: number) => {
    try {
      const asset = images[index];
      await MediaLibrary.deleteAssetsAsync([asset]);
      setImages((prevImages) => prevImages.filter((_, i) => i !== index));
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Image deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting picture:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete image",
      });
    }
  };

  const toggleZoomedImage = (uri: string | null) => {
    setZoomedImage(uri);
  };

  if (hasCameraPermission === null) {
    return <Text>Loading...</Text>;
  }
  if (hasCameraPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          type={type}
          ref={cameraRef}
          flashMode={flash}
        >
          <View style={styles.cameraControls}>
            <Button
              icon="flip-camera"
              onPress={() =>
                setType(
                  type === Camera.Constants.Type.back
                    ? Camera.Constants.Type.front
                    : Camera.Constants.Type.back
                )
              }
            />
            <Button
              icon="flash-on"
              onPress={() =>
                setFlash(
                  flash === Camera.Constants.FlashMode.off
                    ? Camera.Constants.FlashMode.on
                    : Camera.Constants.FlashMode.off
                )
              }
              color={flash === Camera.Constants.FlashMode.off ? "gray" : "#fff"}
            />
          </View>
        </Camera>
      </View>

      <FlatList
        data={images}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => toggleZoomedImage(item.uri)}>
            <Image source={{ uri: item.uri }} style={styles.thumbnail} />
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deletePicture(index)}
            >
              <MaterialIcons name="delete" size={24} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
      />

      {zoomedImage && (
        <TouchableOpacity
          style={styles.zoomedView}
          onPress={() => toggleZoomedImage(null)}
        >
          <Image source={{ uri: zoomedImage }} style={styles.zoomedImage} />
        </TouchableOpacity>
      )}

      <View style={styles.controls}>
        <Button title="Take a picture" onPress={takePicture} icon="camera" />
      </View>

      <Toast ref={(ref) => Toast.setRef(ref)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingTop: Constants.statusBarHeight,
    backgroundColor: "#000",
  },
  cameraContainer: {
    flex: 5,
    alignItems: "center",
    justifyContent: "center",
    margin: 10,
    borderRadius: 10,
  },
  camera: {
    width: "100%",
    aspectRatio: 1, // Ensure camera is square
  },
  cameraControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  controls: {
    flex: 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnail: {
    padding: 10,
    margin: 10,
    width: 100,
    height: 100,
    marginHorizontal: 5,
    borderRadius: 10,
  },
  deleteButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "red",
    borderRadius: 15,
    padding: 5,
    zIndex: 1,
  },
  zoomedView: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  zoomedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
