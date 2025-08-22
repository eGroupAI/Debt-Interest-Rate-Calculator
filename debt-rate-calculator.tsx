"use client"

import { useState, useEffect } from "react"
import { Calculator, AlertTriangle, Save, HelpCircle, DollarSign, FileText, Users, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

const DebtRateCalculator = () => {
  const [rateForm, setRateForm] = useState({
    loanAmount: "",
    actualReceived: "",
    paymentAmount: "",
    totalPeriods: "",
    paymentFrequency: "monthly",
    paymentType: "principal_interest", // principal_interest, interest_only, principal_only
    hasGracePeriod: false, // 新增寬限期選項
    gracePeriod: "",
    interestType: "simple", // simple or compound
    loanStartDate: "", // 新增借款開始日期
  })

  const [rateResult, setRateResult] = useState(null)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [savedDebts, setSavedDebts] = useState([])

  const [saveForm, setSaveForm] = useState({
    debtorName: "",
    creditorName: "",
    totalDebtAmount: "",
    borrowReason: "",
    debtDate: "",
    interestRate: "",
    paymentFrequency: "",
    paymentAmount: "",
    currentStatus: "principal_interest",
    remainingAmount: "",
  })

  const [editingDebt, setEditingDebt] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)

  const frequencyMultipliers = {
    daily: 365,
    weekly: 52,
    biweekly: 26,
    monthly: 12,
    yearly: 1,
  }

  const frequencyLabels = {
    daily: "日還",
    weekly: "週還",
    biweekly: "雙週還",
    monthly: "月還",
    yearly: "年還",
  }

  const paymentTypeLabels = {
    principal_interest: "本息攤還",
    interest_only: "只還利息",
    principal_only: "只還本金",
  }

  // 自動計算功能
  useEffect(() => {
    if (rateForm.loanAmount && rateForm.actualReceived && rateForm.paymentAmount && rateForm.totalPeriods) {
      calculateAPR()
    } else {
      setRateResult(null)
    }
  }, [rateForm])

  // 增強的APR計算功能
  const calculateAPR = () => {
    const loanAmount = Number.parseFloat(rateForm.loanAmount) || 0
    const actualReceived = Number.parseFloat(rateForm.actualReceived) || 0
    const paymentAmount = Number.parseFloat(rateForm.paymentAmount) || 0
    const totalPeriods = Number.parseInt(rateForm.totalPeriods) || 0
    const gracePeriod = Number.parseInt(rateForm.gracePeriod) || 0

    if (loanAmount <= 0 || actualReceived <= 0 || paymentAmount <= 0 || totalPeriods <= 0) {
      setRateResult(null)
      return
    }

    let totalInterest = 0
    let totalPayment = 0
    const effectivePeriods = totalPeriods
    const calculationSteps = []

    // 根據還款方式和利息計算方式
    const periodsPerYear = frequencyMultipliers[rateForm.paymentFrequency]
    const years = totalPeriods / periodsPerYear

    // 記錄計算步驟
    calculationSteps.push(`1. 基本資訊：借款金額 ${loanAmount} 元，實拿金額 ${actualReceived} 元`)
    calculationSteps.push(
      `2. 還款頻率：${frequencyLabels[rateForm.paymentFrequency]}，每期還款 ${paymentAmount} 元，共 ${totalPeriods} 期`,
    )

    switch (rateForm.paymentType) {
      case "principal_interest":
        totalPayment = paymentAmount * totalPeriods
        totalInterest = totalPayment - loanAmount // 修正：總利息 = 總還款 - 借款總金額
        calculationSteps.push(
          `3. 本息攤還計算：每期還款 ${paymentAmount} × 總期數 ${totalPeriods} = 總還款 ${totalPayment} 元`,
        )
        calculationSteps.push(`4. 總利息 = 總還款 ${totalPayment} - 借款總金額 ${loanAmount} = ${totalInterest} 元`)
        break
      case "interest_only":
        totalPayment = paymentAmount * totalPeriods + actualReceived // 修正：總還款包含本金
        totalInterest = paymentAmount * totalPeriods // 只還利息的部分
        calculationSteps.push(
          `3. 只還利息計算：每期利息 ${paymentAmount} × 總期數 ${totalPeriods} = 總利息 ${totalInterest} 元`,
        )
        calculationSteps.push(`4. 總還款 = 總利息 ${totalInterest} + 借款總金額 ${loanAmount} = ${totalPayment} 元`)
        break
      case "principal_only":
        totalPayment = paymentAmount * totalPeriods
        totalInterest = totalPayment - loanAmount // 修正：總利息 = 總還款 - 借款總金額
        calculationSteps.push(
          `3. 只還本金計算：每期還款 ${paymentAmount} × 總期數 ${totalPeriods} = 總還款 ${totalPayment} 元`,
        )
        calculationSteps.push(`4. 總利息 = 總還款 ${totalPayment} - 借款總金額 ${loanAmount} = ${totalInterest} 元`)
        break
    }

    // 計算總費用（借款總金額 - 實際收到金額）
    const totalFees = loanAmount - actualReceived
    calculationSteps.push(`5. 總費用 = 借款總金額 ${loanAmount} - 實際收到金額 ${actualReceived} = ${totalFees} 元`)

    // 如果有寬限期，額外計算
    if (rateForm.hasGracePeriod && gracePeriod > 0) {
      const regularPeriods = totalPeriods - gracePeriod
      const gracePeriodInterest = paymentAmount * gracePeriod
      const regularPayment =
        rateForm.paymentType === "principal_interest"
          ? paymentAmount * regularPeriods
          : loanAmount + paymentAmount * regularPeriods

      totalPayment = gracePeriodInterest + regularPayment
      totalInterest = totalPayment - loanAmount // 重新計算總利息
      calculationSteps.push(`6. 寬限期計算：寬限期 ${gracePeriod} 期，只付利息 ${gracePeriodInterest} 元`)
      calculationSteps.push(`7. 正常還款期 ${regularPeriods} 期，還款金額 ${regularPayment} 元`)
      calculationSteps.push(
        `8. 總還款 = 寬限期利息 + 正常還款 = ${gracePeriodInterest} + ${regularPayment} = ${totalPayment} 元`,
      )
      calculationSteps.push(`9. 總利息 = 總還款 ${totalPayment} - 借款總金額 ${loanAmount} = ${totalInterest} 元`)
    }

    // 計算總成本（總利息 + 總費用）
    const totalCost = totalInterest + totalFees
    const nextStep = rateForm.hasGracePeriod && gracePeriod > 0 ? 10 : 6
    calculationSteps.push(`${nextStep}. 總成本 = 總利息 ${totalInterest} + 總費用 ${totalFees} = ${totalCost} 元`)

    // 計算年化利率
    const averageAnnualCost = totalCost / years
    const apr = (averageAnnualCost / actualReceived) * 100
    calculationSteps.push(
      `${nextStep + 1}. 還款年期 = 總期數 ${totalPeriods} ÷ 年頻率 ${periodsPerYear} = ${years.toFixed(2)} 年`,
    )
    calculationSteps.push(
      `${nextStep + 2}. 平均年成本 = 總成本 ${totalCost} ÷ 還款年期 ${years.toFixed(2)} = ${averageAnnualCost.toFixed(2)} 元/年`,
    )
    calculationSteps.push(
      `${nextStep + 3}. APR = (平均年成本 ${averageAnnualCost.toFixed(2)} ÷ 實拿金額 ${actualReceived}) × 100% = ${apr.toFixed(2)}%`,
    )

    // 單利與複利計算
    let simpleInterestRate = 0
    let compoundInterestRate = 0

    if (rateForm.interestType === "simple") {
      // 單利：本利和 = 本金 + (本金 × 利率) × 期間
      simpleInterestRate = (totalCost / actualReceived / years) * 100 // 修正：使用總成本
      calculationSteps.push(
        `${nextStep + 4}. 單利年利率 = (總成本 ${totalCost} ÷ 實拿金額 ${actualReceived} ÷ 年期 ${years.toFixed(2)}) × 100% = ${simpleInterestRate.toFixed(2)}%`,
      )
    } else {
      // 複利：本利和 = 本金 × (1 + 年利率) ^ 期間
      if (years > 0) {
        compoundInterestRate = (Math.pow((totalPayment + totalFees) / actualReceived, 1 / years) - 1) * 100 // 修正：包含總費用
        calculationSteps.push(
          `${nextStep + 4}. 複利年利率 = (((總還款 ${totalPayment} + 總費用 ${totalFees}) ÷ 實拿金額 ${actualReceived})^(1/${years.toFixed(2)}) - 1) × 100% = ${compoundInterestRate.toFixed(2)}%`,
        )
      }
    }

    // 法定利率警示
    let warningMessage = ""
    let warningLevel = ""
    let violatedLaws = []

    if (apr > 30) {
      warningMessage = "嚴重警告：利率超過當鋪業法上限30%！"
      warningLevel = "critical"
      violatedLaws = ["當鋪業法第11條", "民法第205條", "銀行法第47條之1"]
    } else if (apr > 16) {
      warningMessage = "警告：利率超過民法上限16%！"
      warningLevel = "high"
      violatedLaws = ["民法第205條"]
      if (apr > 15) {
        violatedLaws.push("銀行法第47條之1")
      }
    } else if (apr > 15) {
      warningMessage = "注意：利率超過銀行法上限15%！"
      warningLevel = "medium"
      violatedLaws = ["銀行法第47條之1"]
    }

    const result = {
      totalInterest: totalInterest.toFixed(0),
      totalFees: totalFees.toFixed(0), // 新增總費用
      totalCost: totalCost.toFixed(0),
      totalPayment: totalPayment.toFixed(0),
      impliedFees: 0,
      apr: apr.toFixed(2),
      simpleInterestRate: simpleInterestRate.toFixed(2),
      compoundInterestRate: compoundInterestRate.toFixed(2),
      warningMessage,
      warningLevel,
      violatedLaws,
      years: years.toFixed(1),
      effectivePeriods,
      calculationSteps,
    }

    setRateResult(result)
  }

  const handleFormChange = (field, value) => {
    setRateForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const openSaveForm = () => {
    if (!rateResult) {
      alert("請先完成利率計算")
      return
    }

    setSaveForm((prev) => ({
      ...prev,
      totalDebtAmount: rateForm.loanAmount,
      interestRate: rateResult.apr + "%",
      paymentFrequency: frequencyLabels[rateForm.paymentFrequency],
      paymentAmount: rateForm.paymentAmount,
      currentStatus: rateForm.paymentType,
      remainingAmount: rateForm.loanAmount,
    }))

    setShowSaveForm(true)
  }

  const saveDebtRecord = () => {
    // 移除必填驗證，允許部分資訊為空
    const newDebt = {
      id: Date.now(),
      ...saveForm,
      calculatedAPR: rateResult.apr,
      calculatedAt: new Date().toLocaleString("zh-TW"),
      warningLevel: rateResult.warningLevel,
      violatedLaws: rateResult.violatedLaws,
    }

    setSavedDebts([...savedDebts, newDebt])
    setShowSaveForm(false)
    alert("債務記錄已成功儲存！")

    setSaveForm({
      debtorName: "",
      creditorName: "",
      totalDebtAmount: "",
      borrowReason: "",
      debtDate: "",
      interestRate: "",
      paymentFrequency: "",
      paymentAmount: "",
      currentStatus: "principal_interest",
      remainingAmount: "",
    })
  }

  const openEditForm = (debt) => {
    setEditingDebt(debt)
    setSaveForm({
      debtorName: debt.debtorName || "",
      creditorName: debt.creditorName || "",
      totalDebtAmount: debt.totalDebtAmount || "",
      borrowReason: debt.borrowReason || "",
      debtDate: debt.debtDate || "",
      interestRate: debt.interestRate || "",
      paymentFrequency: debt.paymentFrequency || "",
      paymentAmount: debt.paymentAmount || "",
      currentStatus: debt.currentStatus || "principal_interest",
      remainingAmount: debt.remainingAmount || "",
    })
    setShowEditForm(true)
  }

  const updateDebtRecord = () => {
    const updatedDebts = savedDebts.map((debt) =>
      debt.id === editingDebt.id
        ? {
            ...debt,
            ...saveForm,
            updatedAt: new Date().toLocaleString("zh-TW"),
          }
        : debt,
    )

    setSavedDebts(updatedDebts)
    setShowEditForm(false)
    setEditingDebt(null)
    alert("債務記錄已成功更新！")

    setSaveForm({
      debtorName: "",
      creditorName: "",
      totalDebtAmount: "",
      borrowReason: "",
      debtDate: "",
      interestRate: "",
      paymentFrequency: "",
      paymentAmount: "",
      currentStatus: "principal_interest",
      remainingAmount: "",
    })
  }

  const deleteDebtRecord = (debtId) => {
    if (confirm("確定要刪除這筆債務記錄嗎？")) {
      setSavedDebts(savedDebts.filter((debt) => debt.id !== debtId))
      alert("債務記錄已刪除！")
    }
  }

  // 計算從借款日期到今天的期數
  const calculatePeriodsFromStartDate = () => {
    if (!rateForm.loanStartDate) return

    const startDate = new Date(rateForm.loanStartDate)
    const today = new Date()

    // 計算相差的毫秒數
    const diffTime = Math.abs(today - startDate)

    // 根據還款頻率計算期數
    let periods = 0
    switch (rateForm.paymentFrequency) {
      case "daily":
        periods = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        break
      case "weekly":
        periods = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7))
        break
      case "biweekly":
        periods = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 14))
        break
      case "monthly":
        // 計算月份差
        periods = (today.getFullYear() - startDate.getFullYear()) * 12 + today.getMonth() - startDate.getMonth()
        break
      case "yearly":
        periods = today.getFullYear() - startDate.getFullYear()
        break
    }

    // 更新表單
    handleFormChange("totalPeriods", periods.toString())
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* 專業標題區 */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">債務利率計算機</h1>
            </div>
            <p className="text-gray-600 text-lg">專業財務諮詢工具 • 社工專用版本</p>
            <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
              <Users className="w-4 h-4 mr-1" />
              為社會工作者量身打造的債務評估工具
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* 計算表單區 */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <CardTitle className="flex items-center text-xl">
                  <Calculator className="w-5 h-5 mr-2" />
                  債務資料輸入
                </CardTitle>
                <CardDescription className="text-blue-100">請依序填入債務相關資訊，系統將自動計算利率</CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* 利息計算方式 */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">利息計算方式</h3>
                  <RadioGroup
                    value={rateForm.interestType}
                    onValueChange={(value) => handleFormChange("interestType", value)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="simple" id="simple" />
                      <Label htmlFor="simple" className="flex-1">
                        <div className="font-medium">單利計算</div>
                        <div className="text-xs text-gray-500">本利和 = 本金 + (本金 × 利率 × 期間)</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="compound" id="compound" />
                      <Label htmlFor="compound" className="flex-1">
                        <div className="font-medium">複利計算</div>
                        <div className="text-xs text-gray-500">本利和 = 本金 × (1 + 利率)^期間</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* 基本金額資訊 */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    金額資訊
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="loanAmount" className="flex items-center">
                        借款總金額
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 ml-1 text-blue-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>債務人向債權人借取的總金額</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="loanAmount"
                        type="number"
                        min="0"
                        value={rateForm.loanAmount}
                        onChange={(e) => handleFormChange("loanAmount", e.target.value)}
                        placeholder="例：100,000"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="actualReceived" className="flex items-center">
                        實際收到金額
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 ml-1 text-blue-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              扣除手續費、帳管費、保險費等所有費用後
                              <br />
                              實際入帳的金額
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="actualReceived"
                        type="number"
                        min="0"
                        value={rateForm.actualReceived}
                        onChange={(e) => handleFormChange("actualReceived", e.target.value)}
                        placeholder="例：95,000"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">💡 請扣除所有手續費和附加費用</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 還款設定 */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    還款設定
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>還款頻率</Label>
                      <Select
                        value={rateForm.paymentFrequency}
                        onValueChange={(value) => handleFormChange("paymentFrequency", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">每日還款</SelectItem>
                          <SelectItem value="weekly">每週還款</SelectItem>
                          <SelectItem value="biweekly">雙週還款</SelectItem>
                          <SelectItem value="monthly">每月還款</SelectItem>
                          <SelectItem value="yearly">每年還款</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>還款方式</Label>
                      <Select
                        value={rateForm.paymentType}
                        onValueChange={(value) => handleFormChange("paymentType", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="principal_interest">本息攤還</SelectItem>
                          <SelectItem value="interest_only">只還利息</SelectItem>
                          <SelectItem value="principal_only">只還本金</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 寬限期選項 - 獨立選項 */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasGracePeriod"
                      checked={rateForm.hasGracePeriod}
                      onChange={(e) => handleFormChange("hasGracePeriod", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="hasGracePeriod" className="flex items-center">
                      設定寬限期
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 ml-1 text-blue-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            寬限期內只需繳納利息，不需償還本金
                            <br />
                            又稱「還息不還本」期間
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                  </div>

                  {rateForm.hasGracePeriod && (
                    <div>
                      <Label htmlFor="gracePeriod">寬限期期數</Label>
                      <Input
                        id="gracePeriod"
                        type="number"
                        min="0"
                        value={rateForm.gracePeriod}
                        onChange={(e) => handleFormChange("gracePeriod", e.target.value)}
                        placeholder="只還息不還本的期數"
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="totalPeriods" className="flex items-center">
                      總期數
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 ml-1 text-blue-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>如不確定期數，可使用下方的期數計算器</p>
                          <p className="text-xs mt-1">💝 別擔心！系統會協助您計算正確的期數</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>

                    {/* 期數計算器 */}
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm font-medium text-blue-800 mb-2">期數計算器</div>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={rateForm.loanStartDate}
                          onChange={(e) => handleFormChange("loanStartDate", e.target.value)}
                          className="flex-1"
                          placeholder="借款開始日期"
                        />
                        <Button onClick={calculatePeriodsFromStartDate} variant="outline" size="sm">
                          計算期數
                        </Button>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        💡 輸入借款開始日期，系統將自動計算到今天的期數（單位：
                        {frequencyLabels[rateForm.paymentFrequency].replace("還", "")}）
                        <br />🤗 如果您不確定確切的期數，建議使用此計算器，讓系統幫您精準計算！
                      </p>
                    </div>

                    <div className="mt-2 flex items-center">
                      <Input
                        id="totalPeriods"
                        type="number"
                        min="0"
                        value={rateForm.totalPeriods}
                        onChange={(e) => handleFormChange("totalPeriods", e.target.value)}
                        placeholder={`總共幾期（注意：單位為${frequencyLabels[rateForm.paymentFrequency].replace("還", "")}）`}
                        className="flex-1"
                      />
                      <div className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-md whitespace-nowrap">
                        可直接填寫期數
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentAmount">每期應繳金額</Label>
                      <Input
                        id="paymentAmount"
                        type="number"
                        min="0"
                        value={rateForm.paymentAmount}
                        onChange={(e) => handleFormChange("paymentAmount", e.target.value)}
                        placeholder={`每${frequencyLabels[rateForm.paymentFrequency]}繳納金額`}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />
              </CardContent>
            </Card>

            {/* 計算結果區 */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                <CardTitle className="flex items-center text-xl">
                  <FileText className="w-5 h-5 mr-2" />
                  分析結果
                </CardTitle>
                <CardDescription className="text-green-100">系統自動計算的債務利率分析報告</CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                {rateResult ? (
                  <div className="space-y-6">
                    {/* APR 主要結果 */}
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border">
                      <div className="text-4xl font-bold text-blue-600 mb-2">{rateResult.apr}%</div>
                      <div className="text-lg font-medium text-gray-700 mb-1">總費用年百分率 (APR)</div>
                      <div className="text-sm text-gray-500">Annual Percentage Rate</div>
                    </div>

                    {/* 詳細計算結果 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">總還款金額</div>
                        <div className="text-xl font-bold text-gray-800">
                          NT$ {Number.parseInt(rateResult.totalPayment).toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">總利息支出</div>
                        <div className="text-xl font-bold text-orange-600">
                          NT$ {Number.parseInt(rateResult.totalInterest).toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">總費用支出</div>
                        <div className="text-xl font-bold text-red-600">
                          NT$ {Number.parseInt(rateResult.totalFees).toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">還款年期</div>
                        <div className="text-xl font-bold text-gray-800">{rateResult.years} 年</div>
                      </div>
                    </div>

                    {/* 利率計算結果 */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-3">利率計算詳情</h4>

                      {/* 利率結果 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                        {rateForm.interestType === "simple" ? (
                          <div>
                            <span className="text-blue-700">單利年利率：</span>
                            <span className="font-semibold">{rateResult.simpleInterestRate}%</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-blue-700">複利年利率：</span>
                            <span className="font-semibold">{rateResult.compoundInterestRate}%</span>
                          </div>
                        )}
                        <div>
                          <span className="text-blue-700">月利率：</span>
                          <span className="font-semibold">{(Number.parseFloat(rateResult.apr) / 12).toFixed(3)}%</span>
                        </div>
                      </div>

                      {/* 貸款類型利率參考 */}
                      <div className="mb-4 p-3 bg-white rounded-md border">
                        <h5 className="font-medium text-blue-800 mb-2">常見貸款類型利率參考（年利率）</h5>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                          <div className="flex justify-between">
                            <span>信用卡循環利息：</span>
                            <span className="font-medium text-red-600">5% - 15%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>信用貸款：</span>
                            <span className="font-medium text-orange-600">2% - 16%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>房屋貸款：</span>
                            <span className="font-medium text-green-600">1.3% - 2.5%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>汽車貸款：</span>
                            <span className="font-medium text-blue-600">2% - 7%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>機車貸款：</span>
                            <span className="font-medium text-purple-600">5% - 13%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>民間借貸：</span>
                            <span className="font-medium text-red-700">10% - 30%</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          ⚠️ 以上為市場常見年利率範圍，實際利率依個人信用狀況而定
                        </p>
                      </div>

                      {/* 計算歷程 */}
                      <div className="pt-4 border-t border-blue-200">
                        <h5 className="font-medium text-blue-800 mb-2">計算歷程</h5>
                        <div className="bg-white p-3 rounded-md text-xs text-gray-700 max-h-48 overflow-y-auto space-y-1">
                          {rateResult.calculationSteps.map((step, index) => (
                            <div key={index} className="font-mono">
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 法定利率警示 */}
                    {rateResult.warningMessage && (
                      <Alert
                        className={`${
                          rateResult.warningLevel === "critical"
                            ? "border-red-500 bg-red-50"
                            : rateResult.warningLevel === "high"
                              ? "border-orange-500 bg-orange-50"
                              : "border-yellow-500 bg-yellow-50"
                        }`}
                      >
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            rateResult.warningLevel === "critical"
                              ? "text-red-500"
                              : rateResult.warningLevel === "high"
                                ? "text-orange-500"
                                : "text-yellow-500"
                          }`}
                        />
                        <AlertDescription>
                          <div className="font-semibold mb-2">{rateResult.warningMessage}</div>
                          {rateResult.violatedLaws.length > 0 && (
                            <div className="text-sm">
                              <div className="font-medium mb-1">可能違反法律：</div>
                              <ul className="list-disc list-inside space-y-1">
                                {rateResult.violatedLaws.map((law, index) => (
                                  <li key={index}>{law}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* 法定利率參考 */}
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-3">法定利率上限參考</h4>
                      <div className="space-y-2 text-sm text-green-700">
                        <div className="flex justify-between">
                          <span>民法第205條：</span>
                          <Badge variant="outline">年利率 16%</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>銀行法第47條之1：</span>
                          <Badge variant="outline">年利率 15%</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>當鋪業法第11條：</span>
                          <Badge variant="outline">年利率 30%</Badge>
                        </div>
                      </div>
                    </div>

                    {/* 儲存按鈕 */}
                    <Button
                      onClick={openSaveForm}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                      size="lg"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      儲存至債務記錄檔案
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">等待資料輸入</h3>
                    <p className="text-gray-500 mb-4">請在左側填入債務相關資訊</p>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>✓ 系統將自動計算利率</p>
                      <p>✓ 即時顯示法定利率警示</p>
                      <p>✓ 提供專業分析報告</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 儲存表單彈窗 */}
          {showSaveForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>補充債務詳細資訊</CardTitle>
                  <CardDescription>請填寫完整的債務資訊以建立完整記錄</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="debtorName">債務人姓名</Label>
                      <Input
                        id="debtorName"
                        value={saveForm.debtorName}
                        onChange={(e) => setSaveForm({ ...saveForm, debtorName: e.target.value })}
                        placeholder="欠錢的人"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="creditorName">債權人</Label>
                      <Input
                        id="creditorName"
                        value={saveForm.creditorName}
                        onChange={(e) => setSaveForm({ ...saveForm, creditorName: e.target.value })}
                        placeholder="銀行、信用卡公司、個人等"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="borrowReason">借款原因</Label>
                      <Input
                        id="borrowReason"
                        value={saveForm.borrowReason}
                        onChange={(e) => setSaveForm({ ...saveForm, borrowReason: e.target.value })}
                        placeholder="購屋、創業、醫療、生活費等"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="debtDate">借款日期</Label>
                      <Input
                        id="debtDate"
                        type="date"
                        value={saveForm.debtDate}
                        onChange={(e) => setSaveForm({ ...saveForm, debtDate: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currentStatus">目前還款狀況</Label>
                      <Select
                        value={saveForm.currentStatus}
                        onValueChange={(value) => setSaveForm({ ...saveForm, currentStatus: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="principal_interest">正常本息償還</SelectItem>
                          <SelectItem value="interest_only">僅償還利息</SelectItem>
                          <SelectItem value="unpaid">暫停還款</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="remainingAmount">目前剩餘金額</Label>
                      <Input
                        id="remainingAmount"
                        type="number"
                        min="0"
                        value={saveForm.remainingAmount}
                        onChange={(e) => setSaveForm({ ...saveForm, remainingAmount: e.target.value })}
                        placeholder="尚未償還的金額"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>

                <div className="flex justify-end space-x-3 p-6 pt-0">
                  <Button variant="outline" onClick={() => setShowSaveForm(false)}>
                    取消
                  </Button>
                  <Button onClick={saveDebtRecord} className="bg-blue-600 hover:bg-blue-700">
                    儲存記錄
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* 編輯表單彈窗 */}
          {showEditForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>編輯債務資訊</CardTitle>
                  <CardDescription>修改債務記錄的詳細資訊</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editDebtorName">債務人姓名</Label>
                      <Input
                        id="editDebtorName"
                        value={saveForm.debtorName}
                        onChange={(e) => setSaveForm({ ...saveForm, debtorName: e.target.value })}
                        placeholder="欠錢的人"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="editCreditorName">債權人</Label>
                      <Input
                        id="editCreditorName"
                        value={saveForm.creditorName}
                        onChange={(e) => setSaveForm({ ...saveForm, creditorName: e.target.value })}
                        placeholder="銀行、信用卡公司、個人等"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editBorrowReason">借款原因</Label>
                      <Input
                        id="editBorrowReason"
                        value={saveForm.borrowReason}
                        onChange={(e) => setSaveForm({ ...saveForm, borrowReason: e.target.value })}
                        placeholder="購屋、創業、醫療、生活費等"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="editDebtDate">借款日期</Label>
                      <Input
                        id="editDebtDate"
                        type="date"
                        value={saveForm.debtDate}
                        onChange={(e) => setSaveForm({ ...saveForm, debtDate: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editCurrentStatus">目前還款狀況</Label>
                      <Select
                        value={saveForm.currentStatus}
                        onChange={(e) => setSaveForm({ ...saveForm, currentStatus: e.target.value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="principal_interest">正常本息償還</SelectItem>
                          <SelectItem value="interest_only">僅償還利息</SelectItem>
                          <SelectItem value="unpaid">暫停還款</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="editRemainingAmount">目前剩餘金額</Label>
                      <Input
                        id="editRemainingAmount"
                        type="number"
                        min="0"
                        value={saveForm.remainingAmount}
                        onChange={(e) => setSaveForm({ ...saveForm, remainingAmount: e.target.value })}
                        placeholder="尚未償還的金額"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>

                <div className="flex justify-end space-x-3 p-6 pt-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditForm(false)
                      setEditingDebt(null)
                    }}
                  >
                    取消
                  </Button>
                  <Button onClick={updateDebtRecord} className="bg-blue-600 hover:bg-blue-700">
                    更新記錄
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* 已儲存記錄 */}
          {savedDebts.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  債務記錄檔案 ({savedDebts.length} 筆)
                </CardTitle>
                <CardDescription>已儲存的債務分析記錄</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">債務人</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">債權人</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">APR</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">剩餘金額</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">狀況</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">記錄時間</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {savedDebts.map((debt) => (
                        <tr key={debt.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{debt.debtorName}</td>
                          <td className="px-4 py-3">{debt.creditorName}</td>
                          <td className="px-4 py-3">
                            <Badge
                              className={`${
                                debt.warningLevel === "critical"
                                  ? "bg-red-100 text-red-800"
                                  : debt.warningLevel === "high"
                                    ? "bg-orange-100 text-orange-800"
                                    : debt.warningLevel === "medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
                              }`}
                            >
                              {debt.calculatedAPR}%
                            </Badge>
                          </td>
                          <td className="px-4 py-3">NT$ {Number.parseInt(debt.remainingAmount).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">
                              {debt.currentStatus === "principal_interest"
                                ? "正常還款"
                                : debt.currentStatus === "interest_only"
                                  ? "僅還息"
                                  : "暫停還款"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            <div className="text-xs">
                              <div>建立：{debt.calculatedAt}</div>
                              {debt.updatedAt && <div>更新：{debt.updatedAt}</div>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => openEditForm(debt)}
                                variant="outline"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                編輯
                              </Button>
                              <Button
                                onClick={() => deleteDebtRecord(debt.id)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-800"
                              >
                                刪除
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

export default DebtRateCalculator
