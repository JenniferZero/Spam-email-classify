import React from "react";
import Sidebar from "../components/Sidebar.jsx";
import Stats from "../components/Stats.jsx";
import ComposeModal from "../components/ComposeModal.jsx";

const StatsPage = () => {
  return (
    <div className="gmail-container">
      <Sidebar />
      <div className="gmail-content">
        <Stats />
      </div>
      <ComposeModal />
    </div>
  );
};

export default StatsPage;
