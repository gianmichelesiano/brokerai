import React from 'react';
import { FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DettaglioConfronto {
  clausola: string;
  compagnia: string;
}

interface ConfrontoDettagliato {
  aspetto: string;
  dettagli: DettaglioConfronto[];
}

interface RisultatoAnalisi {
  punti_comuni: string[];
  nome_garanzia: string;
  compagnie_analizzate: string[];
  confronto_dettagliato: ConfrontoDettagliato[];
  riepilogo_principali_differenze: string[];
}

interface ConfrontoData {
  timestamp: string;
  risultati_analisi: RisultatoAnalisi[];
}

interface JsonComparisonViewerProps {
  data: ConfrontoData;
}

const JsonComparisonViewer: React.FC<JsonComparisonViewerProps> = ({ data }) => {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCompanyColor = (compagnia: string) => {
    const colors: Record<string, string> = {
      'NOBIS': 'bg-blue-100 text-blue-800 border-blue-200',
      'AIG': 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[compagnia] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white max-h-96 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Confronto Assicurativo</h2>
        <p className="text-sm text-gray-600">
          Analisi del: {formatTimestamp(data.timestamp)}
        </p>
      </div>

      {data.risultati_analisi.map((analisi, index) => (
        <div key={index} className="space-y-6">
          {/* Header della garanzia */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">{analisi.nome_garanzia}</h3>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {analisi.compagnie_analizzate.map((compagnia, idx) => (
                <span
                  key={idx}
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getCompanyColor(compagnia)}`}
                >
                  {compagnia}
                </span>
              ))}
            </div>
          </div>

          {/* Punti in comune */}
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="text-lg font-semibold text-green-900">Punti in Comune</h4>
            </div>
            <ul className="space-y-2">
              {analisi.punti_comuni.map((punto, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-green-800">{punto}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Confronto dettagliato */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Confronto Dettagliato
            </h4>
            
            {analisi.confronto_dettagliato.map((confronto, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h5 className="font-semibold text-gray-900 mb-4">{confronto.aspetto}</h5>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {confronto.dettagli.map((dettaglio, detIdx) => (
                    <div
                      key={detIdx}
                      className={`p-4 rounded-lg border-2 ${getCompanyColor(dettaglio.compagnia)}`}
                    >
                      <div className="font-medium mb-2">{dettaglio.compagnia}</div>
                      <p className="text-sm">{dettaglio.clausola}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Principali differenze */}
          <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5 text-orange-600" />
              <h4 className="text-lg font-semibold text-orange-900">Principali Differenze</h4>
            </div>
            <ul className="space-y-2">
              {analisi.riepilogo_principali_differenze.map((differenza, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-orange-800">{differenza}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JsonComparisonViewer;