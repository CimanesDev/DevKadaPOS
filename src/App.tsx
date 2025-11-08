import { useState } from "react";
import Index from "./pages/Index";
import Messenger from "./pages/Messenger";

type Page = "pos" | "messenger";

const App = () => {
  const [currentPage, setCurrentPage] = useState<Page>("pos");

  if (currentPage === "messenger") {
    return <Messenger onBack={() => setCurrentPage("pos")} />;
  }

  return <Index onNavigateToMessenger={() => setCurrentPage("messenger")} />;
};

export default App;

