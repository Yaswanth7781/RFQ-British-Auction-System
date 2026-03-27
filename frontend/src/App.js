import RFQForm from "./components/RFQForm";
import Auction from "./components/Auction";

function App() {
  return (
    <div className="app-container">
      <h1>RFQ Auction System</h1>
      <RFQForm />
      <Auction />
    </div>
  );
}

export default App;
