// ReactErrorBoundary.jsx
import React from 'react';

export default class ReactErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="app-crash">
                    <img src={iconCaution}></img>
                    <h2>Oops!</h2>
                    <p>The application has failed unexpectedly</p>

                    <button onClick={() => location.reload()}>Reload</button>
                </div>
            )
        }
        return this.props.children;
    }
}