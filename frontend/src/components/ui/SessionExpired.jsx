export default function SessionExpired({ height }) {
    return (
        <div className="session-expired">
            <p>Your session has expired. Please log in again.</p>
            <button onClick={() => location.reload()}>OK</button>
        </div>
    )
}