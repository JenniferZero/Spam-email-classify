import React from "react";
import Sidebar from "../components/Sidebar.jsx";
import EmailList from "../components/EmailList.jsx";
import ComposeModal from "../components/ComposeModal.jsx";

const InboxPage = () => {
  return (
    <div className="gmail-container">
      <Sidebar />
      <div className="gmail-content">
        <EmailList type="inbox" />
      </div>
      <ComposeModal />
    </div>
  );
};

export default InboxPage;
