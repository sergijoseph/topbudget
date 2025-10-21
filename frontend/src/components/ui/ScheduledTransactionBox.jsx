export default function ScheduledTransactionBox({ transactionDetails, appModal }) {

    return (
        <div className="scheduled-box" 
        onClick={() => {appModal('open', 'editTransaction', { transId: transactionDetails.transId })}}
        >
            <div className="scheduled-box-top">
                <span className="scheduled-box-name">{transactionDetails.transName}</span>
                
            </div>
            <div className="scheduled-box-bottom">
                <span>${transactionDetails.transAmt}</span>
                <span>{transactionDetails.transDate}</span>
            </div>
        </div>
    )
}