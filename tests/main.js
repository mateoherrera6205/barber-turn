import assert from 'assert';
import { Meteor } from 'meteor/meteor';
import { Appointments } from '../imports/api/appointments/appointments';
import { Slots } from '../imports/api/slots/slots';
import { AppointmentsRepository } from '../imports/api/repositories/AppointmentsRepository';
import { SlotsRepository } from '../imports/api/repositories/SlotsRepository';
import { AppointmentService } from '../imports/api/services/AppointmentService';
import { APPOINTMENT_STATUS } from '../imports/utils/constants';

if (Meteor.isServer) {
  const appointmentsRepo = new AppointmentsRepository();
  const slotsRepo = new SlotsRepository();
  const service = new AppointmentService({ appointmentsRepo, slotsRepo });

  describe('Servicio de turnos — AppointmentService', function () {

    beforeEach(async function () {
      await Appointments.removeAsync({});
      await Slots.removeAsync({});
    });

    // ─────────────────────────────────────────────────────────────────────
    describe('Reserva de turnos', function () {
      it('reservar un turno crea el appointment y ocupa el slot', async function () {
        // Preparación: slot libre perteneciente a un barbero de prueba
        const barberId = 'barbero-test-001';
        const fechaPrueba = new Date('2026-07-10T05:00:00.000Z');
        const slotId = await Slots.insertAsync({
          barberId,
          date: fechaPrueba,
          hour: '10:00',
          isAvailable: true,
          appointmentId: null,
          createdAt: new Date(),
        });

        // Ejecución: reservar el slot vía AppointmentService
        const appointmentId = await service.book({
          slotId,
          clientName: 'Ana Flores',
          clientPhone: '0991234567',
        });

        // Verificación (a): el appointment existe con status 'pending'
        const appt = await Appointments.findOneAsync(appointmentId);
        assert.ok(appt, 'El appointment debe haber sido creado en la BD');
        assert.strictEqual(
          appt.status,
          APPOINTMENT_STATUS.PENDING,
          'El turno recién reservado debe quedar en estado pendiente'
        );
        assert.strictEqual(appt.slotId, slotId, 'El appointment debe referenciar el slot correcto');
        assert.strictEqual(appt.barberId, barberId, 'El barberId debe propagarse desde el slot');

        // Verificación (b): el slot quedó marcado como ocupado
        const slot = await Slots.findOneAsync(slotId);
        assert.strictEqual(
          slot.isAvailable,
          false,
          'El slot debe quedar marcado como no disponible'
        );
        assert.strictEqual(
          slot.appointmentId,
          appointmentId,
          'El slot debe referenciar el appointment recién creado'
        );
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    describe('Cancelación de turnos', function () {
      it('un usuario ajeno no puede cancelar un turno que no le pertenece', async function () {
        // Preparación: appointment perteneciente al barbero dueño
        const barberId = 'barbero-dueno-001';
        const usuarioAjeno = 'usuario-ajeno-999';
        const fechaPrueba = new Date('2026-07-10T05:00:00.000Z');

        const slotId = await Slots.insertAsync({
          barberId,
          date: fechaPrueba,
          hour: '11:00',
          isAvailable: false,
          appointmentId: null,
          createdAt: new Date(),
        });

        const appointmentId = await Appointments.insertAsync({
          slotId,
          clientName: 'Juan Pérez',
          clientPhone: '0997654321',
          barberId,
          date: fechaPrueba,
          hour: '11:00',
          status: APPOINTMENT_STATUS.PENDING,
          createdAt: new Date(),
        });

        // Ejecución: intentar cancelar con un userId que no es el barbero dueño
        let errorCapturado = null;
        try {
          await service.cancel({ appointmentId, requestingUserId: usuarioAjeno });
        } catch (err) {
          errorCapturado = err;
        }

        // Verificación (a): se lanzó Meteor.Error con código 'not-authorized'
        assert.ok(errorCapturado, 'Debe lanzarse un error al intentar cancelar sin permiso');
        assert.strictEqual(
          errorCapturado.error,
          'not-authorized',
          'El código del error debe ser not-authorized'
        );

        // Verificación (b): el appointment NO cambió de estado
        const apptDespues = await Appointments.findOneAsync(appointmentId);
        assert.strictEqual(
          apptDespues.status,
          APPOINTMENT_STATUS.PENDING,
          'El estado del appointment no debe haber cambiado'
        );
      });
    });

  });
}
