import { GoogleLogin } from "@react-oauth/google";
import React from "react";
import {useGoogleSignIn} from "@api/auth"

const GoogleLoginBtn = ({ role }) => {
  const googleMutation = useGoogleSignIn();

  const handleGoogleLogin = async (response) => {
      await googleMutation.mutateAsync({
        idToken: response.credential,
        state: { role },
      });
  };

  
  return (
    <>
      <GoogleLogin
        onSuccess={handleGoogleLogin}
        onError={() => console.error("Login Failed")}
        useOneTap
        size="large"
      />
    </>
  );
};

export default GoogleLoginBtn;
