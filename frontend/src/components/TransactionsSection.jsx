import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query"
import { getTransactions } from "../utils/backend";
import queryClient from "../utils/queryClient";
import { isAuthenticated } from "../utils/auth"

import SessionExpired from './ui/SessionExpired';
import LoadingSpinner from './ui/LoadingSpinner'
import LoadingError from './ui/LoadingError'

import iconPencil from '../assets/icon-pencil.png'
import iconList from '../assets/icon-list.png'

export default function TransactionsSection({ appModal, catDetails, loadCatTransactions }) {
    const isLoggedIn = isAuthenticated()

    //Use infinite query hook to get paginated transactions from backend
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useInfiniteQuery({
        queryKey: ['getTransactions', catDetails?.catId],
        queryFn: getTransactions,
        getNextPageParam: (lastPage) => {
            return lastPage.hasMore ? lastPage.nextCursor : undefined
        }
    })

    useEffect(() => {
        queryClient.invalidateQueries({ queryKey: ['getTransactions'] })
    }, [catDetails?.catId])

    const transactions = data?.pages.flatMap(page => page.transactions) ?? []

    return (
        <div className="sub-box transactions-box">
            <div className="box-title"><p>{catDetails?.catId ? 'Category - ' + catDetails?.catName : 'Transactions'}</p></div>
            <button className="add-trans-button" title="Add Transaction" onClick={() => appModal('open', 'addTransaction', {catId: catDetails?.catId})}> + </button>
            {catDetails?.catId &&
                <>
                    {catDetails?.catName !== 'Uncategorized' && <button className="edit-trans-button" title="Edit Category" onClick={() => appModal('open', 'editCategory', { catId: catDetails?.catId })}>
                        <img src={iconPencil} />
                    </button>}
                    <button className="edit-trans-button" title="All Transactions" onClick={() => loadCatTransactions({ catId: '' })}>
                        <img src={iconList} />
                    </button>
                </>}

            <div className="box-content">
                {!isLoggedIn ? <SessionExpired /> : status === 'pending' ? <LoadingSpinner /> :
                    status === 'error' ? <LoadingError contHeight='400px' imgHeight='50px' /> :
                        (<div className="tableScroll">
                            {transactions[0] ?
                                <table>
                                    <thead>
                                        <tr className="transaction-white-color"><th colSpan='2'>Date</th><th>Category</th><th>Account</th><th className="transaction-amt-td">Amount</th></tr>
                                    </thead>
                                    <tbody className="alternating-rows">
                                        {transactions?.map(trans => (
                                            <tr key={trans.transaction_id} onClick={() => appModal('open', 'editTransaction', { transId: trans.transaction_id })}>
                                                <td>{trans.date}</td>
                                                <td>{trans.description}</td>
                                                <td>{trans.category_name}</td>
                                                <td>{trans.account_name}</td>
                                                <td style={{color: trans.type === 'EXPENSE' ? '#971a1a' : '#8dbfa8'}} className="transaction-amt-td">${trans.amount}</td>
                                            </tr>
                                        ))
                                        }
                                    </tbody>
                                </table>
                                :
                                <div className="no-transactions" onClick={() => appModal('open', 'addTransaction', {catId: catDetails?.catId})}>
                                    <button style={{ float: 'none' }} className="add-trans-button"> + </button>
                                    <p>Add Your First Transaction</p>
                                </div>
                            }
                            <div className="load-more">
                                {hasNextPage && <button className="load-more-button" onClick={() => fetchNextPage()} disabled={!hasNextPage || isFetchingNextPage}>
                                    {
                                        isFetchingNextPage ? 'Loading more...' : 'Load more'
                                    }
                                </button>
                                }
                            </div>
                        </div>
                        )
                }
            </div>
        </div>
    )
}