import React from "react";
import Lottie from "lottie-react";
import emailAnimation from "../assets/animations/email-animation.json";

const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <div>
        <Lottie
          animationData={emailAnimation}
          loop={true}
          style={{ width: 200, height: 200 }}
        />
      </div>
      <h1 className="mt-3">Spam Email Classifier</h1>
    </div>
  );
};

export default SplashScreen;
