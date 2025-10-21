import { useState } from 'react'
import errorGif from '../../assets/error-gif.gif'

export default function LoadingError({ contHeight, contWidth, imgHeight }) {
    const [showToolTip, setShowToolTip] = useState('none')

    function showErrorToolTip() {
        setShowToolTip('block')
    }

    function hideErrorToolTip() {
        setShowToolTip('none')
    }

    return (
        <>
            <div
                style={{ height: contHeight, width: contWidth }}
                className="loading-error-container"
                onMouseEnter={showErrorToolTip}
                onMouseLeave={hideErrorToolTip}
            >
                <div className="loading-error" style={{ height: imgHeight }}><img style={{ height: imgHeight }} src={errorGif} /></div>
                <div style={{ display: showToolTip }} className='error-tooltip'>
                    <p>Uh oh! Could not load data.</p>
                    <br />
                    <p>Please refresh the page or try again later.</p>
                    <p>If the issue continues, please contact support.</p>
                </div>
            </div>
        </>

    )
}