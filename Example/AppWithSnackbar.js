import SpInAppUpdates, { IAUUpdateKind, IAUInstallStatus } from "sp-react-native-in-app-updates";
import Snackbar from "react-native-snackbar";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UPDATE_PERSISTENCE_KEY = "UPDATE_STATE";
const FORCE_UPDATE = false; //Set it true for immediate(force) update
const inAppUpdates = new SpInAppUpdates(
  false, // isDebug
);

export const App = props => {

  useEffect(() => {
    const initUpdates = async () => {
      const persitenceValue = await AsyncStorage.getItem(UPDATE_PERSISTENCE_KEY);
      const updatesReady = persitenceValue ? JSON.parse(persitenceValue) : false;
      inAppUpdates.addStatusUpdateListener(status => onStatusUpdate(status));
      if (updatesReady) {
        showSnackbar();
      } else {
        checkUpdateNeeded();
      }
    };
    initUpdates();
    return () => inAppUpdates.removeStatusUpdateListener(status => onStatusUpdate(status));
  }, []);

  const checkUpdateNeeded = () => {
    inAppUpdates
      .checkNeedsUpdate()
      .then(result => {
        if (result.shouldUpdate) {
          let updateOptions = {};
          if (Platform.OS === "android") {
            // android only
            updateOptions = {
              updateType: FORCE_UPDATE ? IAUUpdateKind.IMMEDIATE : IAUUpdateKind.FLEXIBLE,
            };
          } else {
            updateOptions = {
              forceUpgrade: FORCE_UPDATE,
            };
          }
          inAppUpdates.startUpdate(updateOptions);
        }
      })
      .catch(err => console.log("IAU Error: ", err));
  };

  const onStatusUpdate = updateStatus => {
    const { status } = updateStatus ?? {};
    //On updates download
    if (!FORCE_UPDATE && status === IAUInstallStatus.DOWNLOADED) {
      AsyncStorage.setItem(UPDATE_PERSISTENCE_KEY, JSON.stringify(true));
      showSnackbar();
    }
  };

  const showSnackbar = () => {
    Snackbar.show({
      text: "Xyz app has downloaded an update",
      //You can also give duration- Snackbar.LENGTH_SHORT, Snackbar.LENGTH_LONG
      duration: Snackbar.LENGTH_INDEFINITE,
      backgroundColor: "black",
      textColor: "white",
      action: {
        text: "INSTALL",
        textColor: "green",
        onPress: () => {
          installUpdates();
        },
      },
    });
  };

  const installUpdates = () => {
    AsyncStorage.setItem(UPDATE_PERSISTENCE_KEY, JSON.stringify(false));
    inAppUpdates.installUpdate();
  };

  return <View />;
};
