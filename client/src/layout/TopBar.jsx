import { BiFoodMenu } from "react-icons/bi";
import './TopBar.css';

function TopBar({ onToggle }) {
  return (
    <div className="topbar">
      <BiFoodMenu className="menubtn" onClick={onToggle} />
      <h3 className="topbar-title">Road2Dev</h3>
    </div>
  );
}

export default TopBar;
