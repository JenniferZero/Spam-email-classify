import React from "react";
import Sidebar from "../components/Sidebar.jsx";
import EmailList from "../components/EmailList.jsx";
import ComposeModal from "../components/ComposeModal.jsx";

const SpamPage = () => {
  return (
    <div className="gmail-container">
      <Sidebar />
      <div className="gmail-content">
        <EmailList type="spam" />
      </div>
      <ComposeModal />
    </div>
  );
};

export default SpamPage;
