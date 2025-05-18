import React from "react";
import Sidebar from "../components/Sidebar.jsx";
import EmailAnalyzer from "../components/EmailAnalyzer.jsx";
import ComposeModal from "../components/ComposeModal.jsx";

const AnalyzerPage = () => {
  return (
    <div className="gmail-container">
      <Sidebar />
      <div className="gmail-content">
        <EmailAnalyzer />
      </div>
      <ComposeModal />
    </div>
  );
};

export default AnalyzerPage;
