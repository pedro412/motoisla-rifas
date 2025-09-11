import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Image
              src="/images/motisla.png"
              alt="Moto Isla Logo"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold mb-2">Política de Privacidad</h1>
          <p className="text-slate-400 text-lg">MOTO ISLA - Rifas Motociclistas</p>
          <p className="text-slate-500 text-sm">Última actualización: {new Date().toLocaleDateString('es-MX')}</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Introduction */}
          <Card className="bg-slate-800/30 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">1. Introducción</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                En MOTO ISLA, respetamos tu privacidad y nos comprometemos a proteger tus datos personales. 
                Esta Política de Privacidad explica cómo recopilamos, usamos, almacenamos y protegemos tu información 
                cuando utilizas nuestro servicio de rifas motociclistas.
              </p>
              <p>
                Al utilizar nuestros servicios, aceptas las prácticas descritas en esta política.
              </p>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card className="bg-slate-800/30 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">2. Información que Recopilamos</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">2.1 Información Personal</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Nombre completo</li>
                  <li>Número de teléfono</li>
                  <li>Dirección de correo electrónico (opcional)</li>
                  <li>Información de pago y comprobantes</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">2.2 Información de Uso</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Boletos seleccionados y órdenes realizadas</li>
                  <li>Historial de participación en rifas</li>
                  <li>Comunicaciones por WhatsApp</li>
                  <li>Datos de navegación y uso del sitio web</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Usage */}
          <Card className="bg-slate-800/30 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">3. Cómo Utilizamos tu Información</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <ul className="list-disc list-inside space-y-2">
                <li>Procesar tus órdenes y participación en rifas</li>
                <li>Enviar confirmaciones de orden por WhatsApp</li>
                <li>Comunicarnos contigo sobre el estado de tu participación</li>
                <li>Procesar pagos y verificar comprobantes</li>
                <li>Realizar sorteos y contactar ganadores</li>
                <li>Proporcionar soporte al cliente</li>
                <li>Cumplir con obligaciones legales</li>
                <li>Mejorar nuestros servicios</li>
              </ul>
            </CardContent>
          </Card>

          {/* WhatsApp Usage */}
          <Card className="bg-slate-800/30 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">4. Uso de WhatsApp Business</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                Utilizamos WhatsApp Business para comunicarnos contigo de manera eficiente:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Envío automático de confirmaciones de orden</li>
                <li>Recepción de comprobantes de pago</li>
                <li>Soporte al cliente y resolución de dudas</li>
                <li>Notificaciones sobre el estado de rifas</li>
                <li>Comunicación con ganadores</li>
              </ul>
              <p>
                Al proporcionar tu número de teléfono, consientes recibir mensajes de WhatsApp de nuestra parte. 
                Puedes optar por no recibir mensajes en cualquier momento contactándonos.
              </p>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card className="bg-slate-800/30 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">5. Compartir Información</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto en los siguientes casos:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Con tu consentimiento explícito</li>
                <li>Para cumplir con obligaciones legales</li>
                <li>Con proveedores de servicios que nos ayudan a operar (bajo acuerdos de confidencialidad)</li>
                <li>En caso de transferencia de negocio (fusión, adquisición, etc.)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="bg-slate-800/30 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">6. Seguridad de Datos</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Cifrado de datos en tránsito y en reposo</li>
                <li>Acceso restringido a información personal</li>
                <li>Monitoreo regular de seguridad</li>
                <li>Copias de seguridad regulares</li>
                <li>Protocolos de respuesta a incidentes</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Rights */}
          <Card className="bg-slate-800/30 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">7. Tus Derechos</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>Tienes los siguientes derechos sobre tu información personal:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Acceso:</strong> Solicitar una copia de tu información personal</li>
                <li><strong>Rectificación:</strong> Corregir información inexacta o incompleta</li>
                <li><strong>Eliminación:</strong> Solicitar la eliminación de tu información</li>
                <li><strong>Portabilidad:</strong> Recibir tu información en formato estructurado</li>
                <li><strong>Oposición:</strong> Oponerte al procesamiento de tu información</li>
                <li><strong>Limitación:</strong> Solicitar la limitación del procesamiento</li>
              </ul>
              <p>
                Para ejercer estos derechos, contáctanos a través de WhatsApp o correo electrónico.
              </p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card className="bg-slate-800/30 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">8. Retención de Datos</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                Conservamos tu información personal durante el tiempo necesario para:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Cumplir con los propósitos para los que fue recopilada</li>
                <li>Cumplir con obligaciones legales y fiscales</li>
                <li>Resolver disputas y hacer cumplir acuerdos</li>
              </ul>
              <p>
                Generalmente, conservamos los datos de órdenes durante 5 años después de la finalización de la rifa.
              </p>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card className="bg-slate-800/30 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">9. Cookies y Tecnologías Similares</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                Utilizamos cookies y tecnologías similares para:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Mejorar la funcionalidad del sitio web</li>
                <li>Recordar tus preferencias</li>
                <li>Analizar el uso del sitio</li>
                <li>Proporcionar una experiencia personalizada</li>
              </ul>
              <p>
                Puedes controlar las cookies a través de la configuración de tu navegador.
              </p>
            </CardContent>
          </Card>

          {/* Changes */}
          <Card className="bg-slate-800/30 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">10. Cambios a esta Política</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos sobre cambios 
                significativos por WhatsApp o correo electrónico. El uso continuado de nuestros servicios 
                después de los cambios constituye tu aceptación de la política actualizada.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-slate-800/30 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">11. Contacto</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                Si tienes preguntas sobre esta Política de Privacidad o sobre el manejo de tu información personal, 
                puedes contactarnos:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>WhatsApp:</strong> {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+52XXXXXXXXXX'}</li>
                <li><strong>Sitio web:</strong> {process.env.NEXT_PUBLIC_SITE_URL || 'https://motoisla-rifas.com'}</li>
                <li><strong>Empresa:</strong> MOTO ISLA</li>
              </ul>
            </CardContent>
          </Card>

          {/* Legal Compliance */}
          <Card className="bg-slate-800/30 rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">12. Cumplimiento Legal</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                Esta política cumple con las leyes aplicables de protección de datos, incluyendo:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (México)</li>
                <li>Términos de Servicio de WhatsApp Business</li>
                <li>Políticas de Meta/Facebook</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-slate-700">
          <p className="text-slate-400">
            © 2024 MOTO ISLA. Todos los derechos reservados.
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Política de Privacidad válida desde el {new Date().toLocaleDateString('es-MX')}
          </p>
        </div>
      </div>
    </div>
  );
}
