import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '924975223783-5o1oo1g5fnngu6m5vegqb1n86e6av5qp.apps.googleusercontent.com',
  iosClientId: '924975223783-d0b2cdufhvdleq1djqilas0libvvpu9m.apps.googleusercontent.com',
  offlineAccess: true,
});

export { GoogleSignin, statusCodes };
