import { useQuery } from "@tanstack/react-query"
import { getCategoryBalance } from "../../utils/backend"
import { useEffect, useState } from "react"

export default function CategoryBar({ categoryDetails, loadCatTransactions }) {

    const [percent, setPercent] = useState({balance: 0, balanceColor: '#03e3be', balanceColor2: '#F5F5F5'})

    const { data } = useQuery({
        queryKey: ['getCategoryBalance', categoryDetails.catId],
        queryFn: getCategoryBalance
    })

    useEffect(() => {
        if (data) {
            let balancePercent = data / categoryDetails.catAmt * 100;
            let balanceColor = '#A6C2A4'
            let balanceColor2 = '#F5F5F5'
            
            if (balancePercent < 0.00) {
                balancePercent = 100 + balancePercent
                balanceColor = '#F5F5F5'
                balanceColor2 = '#ee1d1dff'
            } else if (balancePercent < 30) {
                balanceColor = 'orange'
            } else if (balancePercent > 100) {
                balancePercent = 100
            } 

            setPercent({balance: balancePercent, balanceColor, balanceColor2})
        }
    }, [data])
    
    return (
        <>
            <div style={{
                background: `linear-gradient(
                to right,
                ${percent.balanceColor} 0%,
                ${percent.balanceColor} ${percent.balance}%,
                ${percent.balanceColor2} ${percent.balance}%,
                ${percent.balanceColor2} 100%
                )`
            }} className="category-bar" onClick={() => loadCatTransactions(categoryDetails)}>
                <span>{categoryDetails.catName}</span>
                <span>${data}</span>
            </div>
        </>
    )
}