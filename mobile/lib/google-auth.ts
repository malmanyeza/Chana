import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '15796302531-aljlkh6bdo4div6mg2gq61nd4o85j83f.apps.googleusercontent.com',
  iosClientId: '15796302531-ggrhlglr0g5hn0pc7nthr1fdopd1o3pj.apps.googleusercontent.com',
  offlineAccess: true,
});

export { GoogleSignin, statusCodes };
