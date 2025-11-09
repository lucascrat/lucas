'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  Download, 
  Phone, 
  CreditCard, 
  Calendar,
  ArrowLeft,
  Filter,
  RefreshCw,
  Trophy,
  Grid,
  Columns,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';

type WinnerType = 'line' | 'column' | 'full-card';

interface Participant {
  id: string;
  name: string;
  phone: string;
  pix_key: string;
  device_id: string;
  created_at: string;
  updated_at: string;
  game_id?: string;
  email?: string;
  is_winner?: boolean;
  winnerType?: WinnerType | null;
  winnerAt?: string | null;
}

interface AdminUser {
  id: string;
  email: string;
}

export default function ParticipantsPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0
  });

  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadParticipants();
    }
  }, [user]);

  useEffect(() => {
    filterParticipants();
  }, [participants, searchTerm]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/admin/participants');
      
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
        calculateStats(data.participants || []);
        toast.success(`${data.participants?.length || 0} participantes carregados`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao carregar participantes');
      }
    } catch (error) {
      console.error('Erro ao carregar participantes:', error);
      toast.error('Erro ao carregar participantes');
    } finally {
      setIsRefreshing(false);
    }
  };

  const calculateStats = (participantsList: Participant[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayCount = participantsList.filter(p => 
      new Date(p.created_at) >= today
    ).length;

    const weekCount = participantsList.filter(p => 
      new Date(p.created_at) >= weekAgo
    ).length;

    setStats({
      total: participantsList.length,
      today: todayCount,
      thisWeek: weekCount
    });
  };

  const filterParticipants = () => {
    if (!searchTerm.trim()) {
      setFilteredParticipants(participants);
      return;
    }

    const filtered = participants.filter(participant =>
      participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.phone.includes(searchTerm) ||
      participant.pix_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredParticipants(filtered);
  };

  const exportParticipants = () => {
    try {
      const typeLabel = (type?: WinnerType | null) => {
        if (type === 'line') return 'Linha';
        if (type === 'column') return 'Coluna';
        if (type === 'full-card') return 'Cartela Cheia';
        return '';
      };

      const csvContent = [
        ['Nome', 'Telefone', 'Chave PIX', 'Email', 'Data de Cadastro', 'Tipo de Bingo', 'Data da Vitória'],
        ...filteredParticipants.map(p => [
          p.name,
          p.phone,
          p.pix_key,
          p.email || '',
          new Date(p.created_at).toLocaleString('pt-BR'),
          typeLabel(p.winnerType),
          p.winnerAt ? new Date(p.winnerAt).toLocaleString('pt-BR') : ''
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `participantes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Lista de participantes exportada com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar lista de participantes');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPhone = (phone: string) => {
    // Formatar telefone brasileiro
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
      }
    return phone;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                <Users className="h-8 w-8 text-purple-600" />
                <span>Participantes</span>
              </h1>
              <p className="text-gray-600 mt-1">Gerencie os participantes do Bingo</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadParticipants}
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </Button>
            <Button
              onClick={exportParticipants}
              disabled={filteredParticipants.length === 0}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
            >
              <Download className="h-4 w-4" />
              <span>Exportar CSV</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Participantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.today}</div>
              <p className="text-xs text-muted-foreground">Novos cadastros hoje</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.thisWeek}</div>
              <p className="text-xs text-muted-foreground">Cadastros nos últimos 7 dias</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Buscar Participantes</CardTitle>
            <CardDescription>
              Pesquise por nome, telefone, chave PIX ou email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Digite para buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchTerm && (
                <Badge variant="secondary" className="px-3 py-1">
                  {filteredParticipants.length} resultado(s)
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Participants List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Lista de Participantes ({filteredParticipants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredParticipants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {participants.length === 0 ? 'Nenhum participante cadastrado' : 'Nenhum resultado encontrado'}
                </h3>
                <p className="text-gray-600">
                  {participants.length === 0 
                    ? 'Os participantes aparecerão aqui quando se cadastrarem no app.'
                    : 'Tente ajustar os termos de busca.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{participant.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            ID: {participant.id.slice(0, 8)}...
                          </Badge>
                          {participant.winnerType && (
                            <Badge
                              className={
                                participant.winnerType === 'line'
                                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                                  : participant.winnerType === 'column'
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                              }
                            >
                              <span className="inline-flex items-center space-x-1">
                                {participant.winnerType === 'line' && <Minus className="h-3 w-3" />}
                                {participant.winnerType === 'column' && <Columns className="h-3 w-3" />}
                                {participant.winnerType === 'full-card' && <Grid className="h-3 w-3" />}
                                <span>
                                  {participant.winnerType === 'line'
                                    ? 'Linha'
                                    : participant.winnerType === 'column'
                                    ? 'Coluna'
                                    : 'Cartela Cheia'}
                                </span>
                              </span>
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-purple-600" />
                            <span>{formatPhone(participant.phone)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-green-600" />
                            <span className="truncate">{participant.pix_key}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span>{formatDate(participant.created_at)}</span>
                          </div>
                        </div>

                        {participant.email && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Email:</strong> {participant.email}
                          </div>
                        )}

                        {participant.winnerAt && (
                          <div className="mt-2 text-sm text-gray-700 flex items-center space-x-2">
                            <Trophy className="h-4 w-4 text-yellow-600" />
                            <span>
                              Venceu em: {formatDate(participant.winnerAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}