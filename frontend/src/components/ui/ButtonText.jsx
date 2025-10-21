export default function ButtonText({children, addStyle, props}) {

    const buttonClass = `button-text ${addStyle}`
    return (
        <button {...props} className={buttonClass}>{children}</button>
    );
}