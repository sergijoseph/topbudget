import { useQuery } from "@tanstack/react-query";
import ScheduledTransactionBox from "./ui/ScheduledTransactionBox";
import { getScheduleTrans } from "../utils/backend";
import LoadingSpinner from "./ui/LoadingSpinner";
import LoadingError from "./ui/LoadingError";

export default function UpcomingSection({ appModal }) {

    const { data: scheduleTransData, isPending, isError } = useQuery({
        queryKey: ['getScheduleTrans'],
        queryFn: getScheduleTrans
    })

    return (
        <div className="upcoming-section">
            <div className="upcoming-header">Upcoming</div>


            {isPending ? <LoadingSpinner height='200px' /> :
                isError ? <LoadingError contHeight='200px' contWidth='180px' imgHeight='50px' /> :
                    scheduleTransData[0] ?
                        <>
                            <div className="add-scheduled-transactions" title="Schedule Transaction" onClick={() => appModal('open', 'addTransaction', { isScheduled: true })}>
                                <button style={{ float: 'none', margin: '0' }} className="add-trans-button"> + </button>
                            </div>
                            <div className="upcoming-list">

                                {scheduleTransData?.map(transDetails => (
                                    <ScheduledTransactionBox key={transDetails.transId} transactionDetails={transDetails} appModal={appModal} />
                                ))}
                            </div>
                        </>
                        :
                        <div className="upcoming-list">
                            <div className="no-scheduled-transactions" onClick={() => appModal('open', 'addTransaction', { isScheduled: true })}>
                                <button style={{ float: 'none' }} className="add-trans-button"> + </button>
                                <p>Add Your First<br /> Scheduled Transaction</p>
                            </div>
                        </div>

            }

        </div>
    )
}