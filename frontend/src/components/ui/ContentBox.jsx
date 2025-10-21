import iconPencil from '../../assets/icon-pencil.png'

export default function ContentBox({ boxTitle, style, children }) {

    const boxClass = `sub-box ${style}`;
    return (
        <div className={boxClass}>
            <div className="box-title">
                <p>{boxTitle}</p>
            </div>
            <div className="box-content">
                {children}
            </div>
        </div>
    );
}