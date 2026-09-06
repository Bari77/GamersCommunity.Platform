using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Rabbit;
using Microsoft.Extensions.Options;
using Platform.Consumer.Configuration;
using Platform.Consumer.Realtime;
using Platform.Consumer.Security;
using Platform.Consumer.Services.Data;
using Serilog;

namespace Platform.Tests.Services.Data
{
    public class MessagesServiceTests : IClassFixture<FakeDataset>
    {
        private readonly FakeDataset _dataset;

        public MessagesServiceTests(FakeDataset dataset) => _dataset = dataset;

        [Fact]
        public async Task Action_Handle_Unknown_Action()
        {
            var service = CreateService();
            await Assert.ThrowsAsync<InternalServerErrorException>(() => service.HandleAsync(new BusMessage
            {
                Type = GamersCommunity.Core.Enums.BusServiceTypeEnum.DATA,
                Action = "UnknownAction",
                Resource = "Messages",
            }));
        }

        [Fact]
        public async Task Get_requires_authenticated_caller()
        {
            var service = CreateService();
            await Assert.ThrowsAsync<UnauthorizedException>(() => service.HandleAsync(new BusMessage
            {
                Type = GamersCommunity.Core.Enums.BusServiceTypeEnum.DATA,
                Action = "Get",
                Resource = "Messages",
                PublicId = Guid.NewGuid(),
            }));
        }

        private MessagesService CreateService() =>
            new(_dataset.CreateFakeContext(), new NoopRealtimeEventPublisher(), CreateCipher(), Log.Logger);

        private static IMessageContentCipher CreateCipher() =>
            new AesGcmMessageContentCipher(Options.Create(new MessageEncryptionSettings
            {
                Key = "MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDA=",
            }));
    }

    file sealed class NoopRealtimeEventPublisher : IRealtimeEventPublisher
    {
        public Task PublishAsync<T>(T payload, CancellationToken ct = default) => Task.CompletedTask;
    }
}
