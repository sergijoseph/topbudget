import { useRouteError } from "react-router-dom";
import iconCaution from '../../assets/caution-sign.png'

export default function AppCrash() {
    const error = useRouteError();

    return (
        <div className="app-crash">
            <img src={iconCaution}></img>
            <h2>Oops!</h2>
            <p>The application has failed unexpectedly</p>

            <button onClick={() => location.reload()}>Reload</button>
        </div>
    )
}