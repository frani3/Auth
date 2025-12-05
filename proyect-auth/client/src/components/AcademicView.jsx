import React, { useState } from 'react'
import { Loader2, Zap, BrainCircuit, TrendingUp, MapPin } from 'lucide-react'
import Card from './Card'
import { callGeminiAPI } from '../api/gemini'

const AcademicView = ({ grades = [], attendance = [], schedule = [] }) => {
  const [subTab, setSubTab] = useState('schedule')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [conceptLoading, setConceptLoading] = useState({})
  const [subjectConcepts, setSubjectConcepts] = useState({})

  const handleAnalyzePerformance = async () => {
    setIsAnalyzing(true)
    const prompt = `Analiza estas notas de un estudiante universitario y dame un diagnóstico breve y estratégico: ${JSON.stringify(grades)}. Enfócate en qué priorizar.`
    const system = "Eres un Coach Académico Experto. Responde en JSON con el campo 'analysis_summary'. Sé directo y motivador."
    try {
      const result = await callGeminiAPI(prompt, system)
      if (result.analysis_summary) setAnalysisResult(result.analysis_summary)
    } catch (e) {
      console.error(e)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGetConcepts = async (subject) => {
    if (subjectConcepts[subject]) return
    setConceptLoading((prev) => ({ ...prev, [subject]: true }))
    const prompt = `Dame 3 conceptos técnicos clave muy breves que se estudian típicamente en la asignatura universitaria: "${subject}".`
    const system = "Eres un profesor universitario. Responde en JSON con el campo 'key_concepts' (array de strings)."
    try {
      const result = await callGeminiAPI(prompt, system)
      if (result.key_concepts) setSubjectConcepts((prev) => ({ ...prev, [subject]: result.key_concepts }))
    } catch (e) {
      console.error(e)
    } finally {
      setConceptLoading((prev) => ({ ...prev, [subject]: false }))
    }
  }

  return (
    <div className="p-4 space-y-4 pb-24 h-full flex flex-col">
      <div className="flex p-1 bg-slate-100 rounded-xl mb-2">
        {['Horario', 'Notas', 'Asistencia'].map((tab) => {
          const key = tab === 'Horario' ? 'schedule' : tab === 'Notas' ? 'grades' : 'attendance'
          return (
            <button
              key={key}
              onClick={() => setSubTab(key)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                subTab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'
              }`}
            >
              {tab}
            </button>
          )
        })}
      </div>
      <div className="flex-1 overflow-y-auto pr-1">
        {subTab === 'schedule' && (
          <div className="space-y-3">
            {schedule.map((item, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center w-14 pt-2">
                  <span className="text-sm font-bold text-slate-800">{item.time}</span>
                  <span className="text-xs text-slate-400">{item.endTime}</span>
                </div>
                <Card className={`flex-1 relative overflow-hidden ${item.status === 'break' ? 'border-2 border-dashed border-slate-200 bg-slate-50' : 'border-l-4 border-l-blue-500'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`font-bold ${item.status === 'break' ? 'text-slate-500' : 'text-slate-800'}`}>{item.subject}</h4>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin size={12} /> {item.room}
                      </p>
                    </div>
                  </div>
                  {item.status !== 'break' && (
                    <div className="mt-3">
                      {!subjectConcepts[item.subject] ? (
                        <button
                          onClick={() => handleGetConcepts(item.subject)}
                          disabled={conceptLoading[item.subject]}
                          className="flex items-center gap-2 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 transition-colors"
                        >
                          {conceptLoading[item.subject] ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                          Conceptos Clave
                        </button>
                      ) : (
                        <div className="animate-fade-in bg-blue-50 p-2 rounded border border-blue-100 mt-1">
                          <p className="text-[10px] font-bold text-blue-700 mb-1 flex items-center gap-1">
                            <BrainCircuit size={10} /> Foco de Estudio:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {subjectConcepts[item.subject].map((c, i) => (
                              <span key={i} className="text-[10px] bg-white text-slate-600 px-1.5 py-0.5 rounded shadow-sm border border-blue-100">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
        )}
        {subTab === 'grades' && (
          <div className="space-y-3">
            <div className="mb-4">
              {!analysisResult ? (
                <button
                  onClick={handleAnalyzePerformance}
                  disabled={isAnalyzing}
                  className="w-full bg-indigo-600 text-white p-3 rounded-xl shadow-md flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  {isAnalyzing ? <Loader2 size={18} className="animate-spin text-indigo-200" /> : <BrainCircuit size={18} className="text-indigo-200" />}
                  <span className="font-bold text-sm">Analizar Rendimiento con IA</span>
                </button>
              ) : (
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl relative animate-fade-in">
                  <button onClick={() => setAnalysisResult(null)} className="absolute top-2 right-2 text-indigo-400 hover:text-indigo-600">
                    ×
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-indigo-800 text-sm">Diagnóstico Gemini</h3>
                  </div>
                  <p className="text-sm text-indigo-900 leading-relaxed">{analysisResult}</p>
                </div>
              )}
            </div>
            {grades.map((g, i) => (
              <Card key={i} className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800">{g.subject}</h4>
                  <p className="text-xs text-slate-400">Promedio Parcial</p>
                </div>
                <div className={`text-xl font-bold px-3 py-1 rounded-lg ${
                  g.status === 'risk' ? 'bg-red-100 text-red-600' : g.status === 'excellent' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {g.grade}
                </div>
              </Card>
            ))}
          </div>
        )}
        {subTab === 'attendance' && (
          <div className="space-y-3">
            {attendance.map((a, i) => (
              <Card key={i}>
                <div className="flex justify-between mb-2">
                  <h4 className="font-bold text-slate-800">{a.subject}</h4>
                  <span className={`text-sm font-bold ${a.percentage < 70 ? 'text-red-500' : 'text-slate-600'}`}>{a.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${a.percentage < 70 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${a.percentage}%` }}></div>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-right">{a.attended} de {a.total} clases</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AcademicView
