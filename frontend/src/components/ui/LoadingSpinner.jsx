export default function LoadingSpinner({height, small}) {

    let className = 'loading-spinner'
    if (small) {
        className = 'loading-spinner-small'
        height = '20px'
    }

    return (
        <div style={{height}} className="loading-spinner-container">
            <div className={className}></div>
        </div>
    )
}